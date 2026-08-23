const Dispute = require("../models/Dispute");
const Order = require("../models/Order");

// Which statuses each role is allowed to move a dispute into
const ALLOWED_TRANSITIONS = {
  seller: [
    "SELLER_RESPONDED",
    "RESOLVED_REFUND",
    "RESOLVED_REPLACE",
    "RESOLVED_REJECTED",
  ],
  buyer: ["ESCALATED", "CLOSED"],
  admin: [
    "SELLER_RESPONDED",
    "ESCALATED",
    "UNDER_REVIEW",
    "RESOLVED_REFUND",
    "RESOLVED_REPLACE",
    "RESOLVED_REJECTED",
    "CLOSED",
  ],
};

// Human readable note stored on the timeline for each status
const TIMELINE_NOTES = {
  SELLER_RESPONDED: "Seller replied to the buyer",
  ESCALATED: "Buyer asked eBay to step in and help",
  UNDER_REVIEW: "eBay is reviewing this request",
  RESOLVED_REFUND: "Request closed with a refund",
  RESOLVED_REPLACE: "Request closed with a replacement",
  RESOLVED_REJECTED: "Request was declined",
  CLOSED: "Request was closed",
};

// The resolution recorded automatically when a case reaches a final status
const RESOLUTION_BY_STATUS = {
  RESOLVED_REFUND: "REFUND_FULL",
  RESOLVED_REPLACE: "REPLACEMENT",
  RESOLVED_REJECTED: "REJECTED",
};

// [POST] /api/disputes - open a new request against an order
exports.createDispute = async (req, res) => {
  try {
    const { orderId, reason, description, evidenceImages } = req.body;

    // Read the original order so we know exactly who the seller is
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Related order not found" });
    }

    if (order.buyerId.toString() !== req.userId) {
      return res
        .status(403)
        .json({ message: "You can only open a request for your own order" });
    }

    const existing = await Dispute.findOne({
      orderId: order._id,
      status: { $nin: ["CLOSED", "RESOLVED_REJECTED"] },
    });
    if (existing) {
      return res.status(409).json({
        message: "There is already an open request for this order",
        disputeId: existing._id,
      });
    }

    const newDispute = new Dispute({
      orderId: order._id,
      sellerId: order.sellerId, // Take the seller straight from the order
      buyerId: req.userId,
      reason,
      description,
      evidenceImages: evidenceImages || [],
      timeline: [
        {
          actor: "buyer",
          action: "created",
          note: "Buyer opened this request",
        },
      ],
    });

    await newDispute.save();

    // ---------------------------------------------------------
    // MOCK ADMIN NOTIFICATION
    // ---------------------------------------------------------
    console.log("\n=================================================");
    console.log("[SYSTEM MOCK] NOTIFICATION SENT TO ADMIN");
    console.log(`- New request on order: ${order._id}`);
    console.log(`- Reason: ${reason}`);
    console.log(`- Buyer ID: ${req.userId}`);
    console.log("=================================================\n");

    res.status(201).json(newDispute);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error while creating the request" });
  }
};

// [GET] /api/disputes - list requests, scoped to the caller's role
exports.getDisputes = async (req, res) => {
  try {
    const filter = {};

    // Strict data separation between roles
    if (req.userRole === "buyer") {
      filter.buyerId = req.userId; // Buyers only see requests they opened
    } else if (req.userRole === "seller") {
      filter.sellerId = req.userId; // Sellers only see requests against them
    }
    // Admins keep an empty filter so they see every case

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const disputes = await Dispute.find(filter)
      .populate(
        "orderId",
        "listingTitle listingImage quantity pricing status createdAt",
      )
      .populate("buyerId", "username name email")
      .populate("sellerId", "username name email")
      .sort({ createdAt: -1 });

    res.status(200).json(disputes);
  } catch (error) {
    res.status(500).json({ message: "Unable to load the request list" });
  }
};

// [PATCH] /api/disputes/:id - move the case forward and log the timeline
exports.updateDisputeStatus = async (req, res) => {
  try {
    const { status, sellerResponse, resolutionNote, resolutionAmount } =
      req.body;

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Work out how the caller relates to this specific case
    let actorRole = "system";
    if (req.userRole === "admin") {
      actorRole = "admin";
    } else if (dispute.sellerId.toString() === req.userId) {
      actorRole = "seller";
    } else if (dispute.buyerId.toString() === req.userId) {
      actorRole = "buyer";
    } else {
      return res
        .status(403)
        .json({ message: "You don't have access to this request" });
    }

    if (!(ALLOWED_TRANSITIONS[actorRole] || []).includes(status)) {
      return res
        .status(400)
        .json({ message: `A ${actorRole} cannot set the status to ${status}` });
    }

    if (status === "SELLER_RESPONDED" && !sellerResponse?.trim()) {
      return res.status(400).json({ message: "A reply message is required" });
    }

    dispute.status = status;

    if (sellerResponse?.trim()) {
      dispute.sellerResponse = sellerResponse.trim();
    }

    if (RESOLUTION_BY_STATUS[status]) {
      dispute.resolution = {
        type:
          status === "RESOLVED_REFUND" && resolutionAmount
            ? "REFUND_PARTIAL"
            : RESOLUTION_BY_STATUS[status],
        amount: resolutionAmount || undefined,
        note: resolutionNote || TIMELINE_NOTES[status],
        resolvedBy: req.userId,
        resolvedAt: new Date(),
      };
    }

    // Push the new event onto the history array
    dispute.timeline.push({
      actor: actorRole,
      action: status,
      note:
        status === "SELLER_RESPONDED"
          ? `Seller replied: ${sellerResponse.trim()}`
          : resolutionNote || TIMELINE_NOTES[status] || "Status updated",
      timestamp: new Date(),
    });

    await dispute.save();

    res.status(200).json(dispute);
  } catch (error) {
    res.status(500).json({ message: "Unable to update the request status" });
  }
};

// [GET] /api/disputes/:id - read one request
exports.getDisputeById = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate(
        "orderId",
        "listingTitle listingImage quantity pricing status paymentMethod shippingAddress createdAt",
      )
      .populate("buyerId", "username name email")
      .populate("sellerId", "username name email");

    if (!dispute) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Populate turns the ids into objects, so read the real id back out
    const actualSellerId = dispute.sellerId?._id
      ? dispute.sellerId._id.toString()
      : dispute.sellerId.toString();

    const actualBuyerId = dispute.buyerId?._id
      ? dispute.buyerId._id.toString()
      : dispute.buyerId.toString();

    // Block cross-account access
    if (
      req.userRole !== "admin" &&
      req.userId !== actualBuyerId &&
      req.userId !== actualSellerId
    ) {
      return res
        .status(403)
        .json({ message: "You don't have access to this request" });
    }

    res.status(200).json(dispute);
  } catch (error) {
    res.status(500).json({ message: "Server error while loading the request" });
  }
};
