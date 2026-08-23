require("dotenv").config({ path: ".env" });
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const Listing = require("../models/Listing");
const User = require("../models/User");
const Order = require("../models/Order");
const Review = require("../models/Review");
const Dispute = require("../models/Dispute");

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");
};

const listings = [
  {
    title: "Apple iPhone 13 128GB Unlocked",
    subtitle: "Excellent - 90%+ Battery",
    description:
      "Apple iPhone 13 128GB Unlocked in excellent condition with 90%+ battery health.",
    condition: "like_new",
    images: ["/seed-images/smartphone.png"],
    pricing: { currency: "VND", fixedPrice: 8323071 },
    totalQuantity: 5,
    status: "active",
    isFeatured: true,
    stats: { views: 0, watchers: 0, soldQuantity: 3 },
  },
  {
    title: "Dyson UP30 Ball Animal 3 | Nickel/Silver | Refurbished",
    subtitle: "Certified Refurbished",
    description:
      "Dyson UP30 Ball Animal 3 vacuum cleaner in nickel/silver. Certified refurbished.",
    condition: "good",
    images: ["/seed-images/home-garden.png"],
    pricing: { currency: "VND", fixedPrice: 5531767 },
    totalQuantity: 3,
    status: "active",
    isFeatured: false,
    stats: { views: 0, watchers: 0, soldQuantity: 2 },
  },
  {
    title: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
    subtitle: "Black - Brand New",
    description: "Sony WH-1000XM5 industry leading noise canceling headphones.",
    condition: "new",
    images: ["/seed-images/tech.png"],
    pricing: { currency: "VND", fixedPrice: 6500000 },
    totalQuantity: 6,
    status: "active",
    isFeatured: true,
    stats: { views: 0, watchers: 0, soldQuantity: 4 },
  },
  {
    title: "Samsung Galaxy S23 Ultra 256GB",
    subtitle: "Phantom Black - Unlocked",
    description:
      "Samsung Galaxy S23 Ultra 256GB Phantom Black factory unlocked.",
    condition: "new",
    images: ["/seed-images/smartphone.png"],
    pricing: { currency: "VND", fixedPrice: 12000000 },
    totalQuantity: 3,
    status: "active",
    isFeatured: true,
    stats: { views: 0, watchers: 0, soldQuantity: 2 },
  },
  {
    title: "Nike Air Jordan 1 Retro High OG",
    subtitle: "Chicago - Size 42",
    description: "Nike Air Jordan 1 Retro High OG Chicago colorway size 42.",
    condition: "new",
    images: ["/seed-images/shoes.png"],
    pricing: { currency: "VND", fixedPrice: 4800000 },
    totalQuantity: 1,
    status: "active",
    isFeatured: false,
    stats: { views: 0, watchers: 0, soldQuantity: 1 },
  },
  {
    title: "MacBook Pro 14 inch M3 Pro 2023",
    subtitle: "Space Black 18GB RAM 512GB SSD",
    description:
      "Apple MacBook Pro 14 inch with M3 Pro chip, 18GB RAM, 512GB SSD.",
    condition: "new",
    images: ["/seed-images/laptop.png"],
    pricing: { currency: "VND", fixedPrice: 45000000 },
    totalQuantity: 2,
    status: "active",
    isFeatured: true,
    stats: { views: 0, watchers: 0, soldQuantity: 2 },
  },
  {
    title: "Canon EOS R6 Mark II Mirrorless Camera",
    subtitle: "Body Only",
    description: "Canon EOS R6 Mark II mirrorless camera body only.",
    condition: "new",
    images: ["/seed-images/lenses-and-filters.png"],
    pricing: { currency: "VND", fixedPrice: 52000000 },
    totalQuantity: 1,
    status: "active",
    isFeatured: true,
    stats: { views: 0, watchers: 0, soldQuantity: 0 },
  },
  {
    title: "Lego Technic Bugatti Chiron 42083",
    subtitle: "New Sealed Box",
    description: "Lego Technic Bugatti Chiron set 42083 new and sealed.",
    condition: "new",
    images: ["/seed-images/trading-cards.png"],
    pricing: { currency: "VND", fixedPrice: 3200000 },
    totalQuantity: 7,
    status: "active",
    isFeatured: false,
    stats: { views: 0, watchers: 0, soldQuantity: 0 },
  },
  {
    title: "Apple iPad 9th Gen 64GB Wi-Fi",
    subtitle: "Space Gray - Excellent condition",
    description:
      "Apple iPad 9th generation with 64GB storage and Wi-Fi. Clean screen, strong battery, and ready to use.",
    condition: "like_new",
    images: ["/seed-images/tablet.png"],
    pricing: { currency: "VND", fixedPrice: 4372675 },
    totalQuantity: 4,
    status: "active",
    isFeatured: false,
    stats: { views: 0, watchers: 0, soldQuantity: 1 },
  },
  {
    title: "Mechanical Keyboard RGB Hot-swappable",
    subtitle: "Compact 75% layout",
    description:
      "RGB mechanical keyboard with hot-swappable switches, compact layout, and USB-C connection.",
    condition: "new",
    images: ["/seed-images/keyboard.png"],
    pricing: { currency: "VND", fixedPrice: 1290000 },
    totalQuantity: 9,
    status: "active",
    isFeatured: false,
    stats: { views: 0, watchers: 0, soldQuantity: 2 },
  },
  {
    title: "Ronaldinho Brazil Retro Football Shirt",
    subtitle: "Collector jersey - Size L",
    description:
      "Retro Brazil football shirt inspired by Ronaldinho era. Great for collectors and casual wear.",
    condition: "good",
    images: ["/seed-images/ronadinho-shirt.png"],
    pricing: { currency: "VND", fixedPrice: 890000 },
    totalQuantity: 3,
    status: "active",
    isFeatured: false,
    stats: { views: 0, watchers: 0, soldQuantity: 1 },
  },
  {
    title: "Trading Cards Mixed Collector Lot",
    subtitle: "Sports and entertainment cards",
    description:
      "Mixed collector lot with protected trading cards. Good starter pack for collectors.",
    condition: "good",
    images: ["/seed-images/trading-cards.png"],
    pricing: { currency: "VND", fixedPrice: 740000 },
    totalQuantity: 5,
    status: "active",
    isFeatured: true,
    stats: { views: 0, watchers: 0, soldQuantity: 1 },
  },
];

const reviewComments = [
  "Item arrived quickly and matched the description. Very happy with this purchase.",
  "Good seller, careful packaging, and the product condition is accurate.",
  "Smooth transaction. The item works well and delivery was on time.",
  "Exactly as listed. I would buy from this seller again.",
  "Great value for the price. Communication was clear.",
  "Product is clean, shipped safely, and feels reliable.",
];

const reviewDetails = [
  { itemDescription: 5, communication: 5, shippingTime: 5, shippingCost: 5 },
  { itemDescription: 4, communication: 5, shippingTime: 4, shippingCost: 4 },
  { itemDescription: 5, communication: 4, shippingTime: 5, shippingCost: 5 },
  { itemDescription: 4, communication: 4, shippingTime: 4, shippingCost: 5 },
  { itemDescription: 5, communication: 5, shippingTime: 5, shippingCost: 4 },
  { itemDescription: 5, communication: 5, shippingTime: 4, shippingCost: 5 },
];

// Relative timestamps so the seeded requests look like a live queue
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

// Placeholder evidence photos reuse the seed images already served by the app
const evidence = (...names) => names.map((name) => `/seed-images/${name}.png`);

// One scenario per seeded request, covering every status in the Dispute model
const disputeScenarios = [
  {
    reason: "NOT_RECEIVED",
    priority: "HIGH",
    status: "OPEN",
    openedDaysAgo: 1,
    description:
      "Tracking has shown 'in transit' for nine days and the parcel never arrived. I checked with my local carrier and they have no record of a delivery attempt. Please advise or send a replacement.",
    evidenceImages: [],
    timeline: [
      {
        actor: "buyer",
        action: "created",
        note: "Buyer opened this request",
        daysAgo: 1,
      },
    ],
  },
  {
    reason: "DAMAGED",
    priority: "HIGH",
    status: "OPEN",
    openedDaysAgo: 2,
    description:
      "The box arrived crushed on one corner and the item has a cracked casing. It powers on but the screen flickers. Photos of the packaging and the damage are attached.",
    evidenceImages: evidence("smartphone", "home-garden"),
    timeline: [
      {
        actor: "buyer",
        action: "created",
        note: "Buyer opened this request",
        daysAgo: 2,
      },
    ],
  },
  {
    reason: "NOT_AS_DESCRIBED",
    priority: "MEDIUM",
    status: "SELLER_RESPONDED",
    openedDaysAgo: 5,
    description:
      "The listing said 'like new, no scratches' but there are deep scuffs across the back panel and the battery health reads 82%, not the 90%+ advertised.",
    evidenceImages: evidence("smartphone"),
    sellerResponse:
      "Thanks for the photos. I'm sorry the condition doesn't match the listing. I can offer a 20% partial refund if you'd like to keep it, or a prepaid return label for a full refund. Just let me know which you prefer.",
    timeline: [
      {
        actor: "buyer",
        action: "created",
        note: "Buyer opened this request",
        daysAgo: 5,
      },
      {
        actor: "seller",
        action: "SELLER_RESPONDED",
        note: "Seller replied: Offered a 20% partial refund or a prepaid return label.",
        daysAgo: 4,
      },
    ],
  },
  {
    reason: "MISSING_PARTS",
    priority: "MEDIUM",
    status: "SELLER_RESPONDED",
    openedDaysAgo: 6,
    description:
      "The charger and one of the two filters listed in the description were not in the box. Everything else looks fine.",
    evidenceImages: evidence("home-garden"),
    sellerResponse:
      "Apologies, the accessory bag was left out during packing. I've shipped the charger and filter today, tracking number VN882140913. They should reach you within 3 business days.",
    timeline: [
      {
        actor: "buyer",
        action: "created",
        note: "Buyer opened this request",
        daysAgo: 6,
      },
      {
        actor: "seller",
        action: "SELLER_RESPONDED",
        note: "Seller replied: Missing accessories shipped separately, tracking VN882140913.",
        daysAgo: 5,
      },
    ],
  },
  {
    reason: "FAKE_COUNTERFEIT",
    priority: "HIGH",
    status: "ESCALATED",
    openedDaysAgo: 12,
    description:
      "The serial number does not appear in the manufacturer's database and the packaging print quality is poor. I believe this item is counterfeit and I want a full refund.",
    evidenceImages: evidence("trading-cards", "smartphone"),
    sellerResponse:
      "The item was bought from an authorised distributor and I stand behind it being genuine. I'm not able to refund on this basis.",
    timeline: [
      {
        actor: "buyer",
        action: "created",
        note: "Buyer opened this request",
        daysAgo: 12,
      },
      {
        actor: "seller",
        action: "SELLER_RESPONDED",
        note: "Seller replied: Item is sourced from an authorised distributor, refund declined.",
        daysAgo: 10,
      },
      {
        actor: "buyer",
        action: "ESCALATED",
        note: "Buyer asked eBay to step in and help",
        daysAgo: 8,
      },
    ],
  },
  {
    reason: "REFUND_NOT_RECEIVED",
    priority: "MEDIUM",
    status: "UNDER_REVIEW",
    openedDaysAgo: 15,
    description:
      "The seller agreed to a refund two weeks ago and confirmed it was sent, but nothing has reached my account. My bank has no record of an incoming transfer.",
    evidenceImages: [],
    sellerResponse:
      "The refund was issued from my side on the same day. I've attached the payment reference and I'm happy for eBay to verify it.",
    timeline: [
      {
        actor: "buyer",
        action: "created",
        note: "Buyer opened this request",
        daysAgo: 15,
      },
      {
        actor: "seller",
        action: "SELLER_RESPONDED",
        note: "Seller replied: Refund was issued, payment reference provided.",
        daysAgo: 13,
      },
      {
        actor: "buyer",
        action: "ESCALATED",
        note: "Buyer asked eBay to step in and help",
        daysAgo: 11,
      },
      {
        actor: "admin",
        action: "UNDER_REVIEW",
        note: "eBay is reviewing this request",
        daysAgo: 10,
      },
    ],
  },
  {
    reason: "WRONG_ITEM",
    priority: "MEDIUM",
    status: "RESOLVED_REFUND",
    openedDaysAgo: 21,
    description:
      "I ordered the black 128GB version and received a white 64GB one. The invoice in the box lists a different order number entirely.",
    evidenceImages: evidence("smartphone"),
    sellerResponse:
      "You're right, two orders were swapped at packing. A full refund has been issued and you can keep the item, no return needed. Sorry for the mix-up.",
    resolution: {
      type: "REFUND_FULL",
      note: "Full refund issued, buyer keeps the item",
      resolvedDaysAgo: 18,
    },
    timeline: [
      {
        actor: "buyer",
        action: "created",
        note: "Buyer opened this request",
        daysAgo: 21,
      },
      {
        actor: "seller",
        action: "SELLER_RESPONDED",
        note: "Seller replied: Confirmed a packing mix-up, refund on the way.",
        daysAgo: 20,
      },
      {
        actor: "seller",
        action: "RESOLVED_REFUND",
        note: "Full refund issued, buyer keeps the item",
        daysAgo: 18,
      },
    ],
  },
  {
    reason: "LATE_DELIVERY",
    priority: "LOW",
    status: "RESOLVED_REPLACE",
    openedDaysAgo: 25,
    description:
      "Delivery was eleven days past the estimated date and the item was needed as a birthday gift. The outer sleeve was also bent in transit.",
    evidenceImages: evidence("trading-cards"),
    sellerResponse:
      "Sorry about the delay, the courier held the parcel at a sorting hub. I've sent a replacement by express shipping at no charge.",
    resolution: {
      type: "REPLACEMENT",
      note: "Replacement shipped by express delivery",
      resolvedDaysAgo: 22,
    },
    timeline: [
      {
        actor: "buyer",
        action: "created",
        note: "Buyer opened this request",
        daysAgo: 25,
      },
      {
        actor: "seller",
        action: "SELLER_RESPONDED",
        note: "Seller replied: Courier delay acknowledged, replacement offered.",
        daysAgo: 24,
      },
      {
        actor: "seller",
        action: "RESOLVED_REPLACE",
        note: "Replacement shipped by express delivery",
        daysAgo: 22,
      },
    ],
  },
  {
    reason: "NOT_AS_DESCRIBED",
    priority: "LOW",
    status: "RESOLVED_REJECTED",
    openedDaysAgo: 30,
    description:
      "The colour looks different from the listing photos under indoor lighting and I would like to return it.",
    evidenceImages: [],
    sellerResponse:
      "The listing photos are unedited and the colour is stated in the description. This is outside the 30-day returns window, so I'm unable to accept a return.",
    resolution: {
      type: "REJECTED",
      note: "Request declined - outside the returns window",
      resolvedDaysAgo: 27,
    },
    timeline: [
      {
        actor: "buyer",
        action: "created",
        note: "Buyer opened this request",
        daysAgo: 30,
      },
      {
        actor: "seller",
        action: "SELLER_RESPONDED",
        note: "Seller replied: Listing photos are accurate, the return window has closed.",
        daysAgo: 29,
      },
      {
        actor: "seller",
        action: "RESOLVED_REJECTED",
        note: "Request declined - outside the returns window",
        daysAgo: 27,
      },
    ],
  },
  {
    reason: "OTHER",
    priority: "LOW",
    status: "CLOSED",
    openedDaysAgo: 34,
    description:
      "I think I was charged twice for this order - there are two identical pending charges on my card statement.",
    evidenceImages: [],
    timeline: [
      {
        actor: "buyer",
        action: "created",
        note: "Buyer opened this request",
        daysAgo: 34,
      },
      {
        actor: "buyer",
        action: "CLOSED",
        note: "Buyer withdrew the request - the duplicate charge was a temporary bank hold",
        daysAgo: 32,
      },
    ],
  },
];

const buildDisputeData = ({ buyer, seller, order, scenario }) => ({
  orderId: order._id,
  buyerId: buyer._id,
  sellerId: seller._id,
  reason: scenario.reason,
  description: scenario.description,
  evidenceImages: scenario.evidenceImages || [],
  sellerResponse: scenario.sellerResponse || "",
  status: scenario.status,
  priority: scenario.priority,
  resolution: scenario.resolution
    ? {
        type: scenario.resolution.type,
        amount: scenario.resolution.amount,
        note: scenario.resolution.note,
        resolvedBy: seller._id,
        resolvedAt: daysAgo(scenario.resolution.resolvedDaysAgo),
      }
    : { type: "NONE" },
  timeline: scenario.timeline.map((event) => ({
    actor: event.actor,
    action: event.action,
    note: event.note,
    timestamp: daysAgo(event.daysAgo),
  })),
  createdAt: daysAgo(scenario.openedDaysAgo),
  updatedAt: daysAgo(scenario.timeline[scenario.timeline.length - 1].daysAgo),
});

const buildOrderData = ({ buyer, seller, listing, isReviewed }) => ({
  buyerId: buyer._id,
  sellerId: seller._id,
  listingId: listing._id,
  listingTitle: listing.title,
  listingImage: listing.images?.[0] || "",
  quantity: 1,
  pricing: {
    itemPrice: listing.pricing.fixedPrice,
    quantity: 1,
    subtotal: listing.pricing.fixedPrice,
    shippingCost: 30000,
    total: listing.pricing.fixedPrice + 30000,
    currency: "VND",
  },
  shippingAddress: {
    fullName: buyer.name,
    phone: "0900000000",
    street: "1 Demo Street",
    city: "Ho Chi Minh City",
    country: "Vietnam",
  },
  status: "delivered",
  paymentStatus: "paid",
  paymentMethod: "COD",
  isReviewed,
});

const seed = async () => {
  try {
    await connectDB();

    await User.deleteMany({
      email: { $in: ["seller.demo@ebay.local", "buyer.demo@ebay.local"] },
    });

    const seller = await User.create({
      email: "seller.demo@ebay.local",
      password: "123456",
      name: "Demo Seller",
      username: "demo_seller",
      role: "seller",
    });

    const buyer = await User.create({
      email: "buyer.demo@ebay.local",
      password: "123456",
      name: "Demo Buyer",
      username: "demo_buyer",
      role: "buyer",
    });

    await Dispute.deleteMany({});
    await Review.deleteMany({});
    await Order.deleteMany({});
    await Listing.deleteMany({});
    console.log("Deleted old listings, orders, reviews, and requests");

    const insertedListings = await Listing.insertMany(
      listings.map((listing) => ({
        ...listing,
        sellerId: seller._id,
        reviews: { averageRating: 0, reviewCount: 0 },
      })),
    );

    const reviewedOrders = await Order.insertMany(
      insertedListings
        .slice(0, 6)
        .map((listing) =>
          buildOrderData({ buyer, seller, listing, isReviewed: true }),
        ),
    );

    const reviewsToInsert = reviewedOrders.map((order, index) => ({
      orderId: order._id,
      listingId: order.listingId,
      buyerId: buyer._id,
      sellerId: seller._id,
      rating: [5, 4, 5, 4, 5, 5][index],
      feedbackType: [
        "positive",
        "positive",
        "positive",
        "neutral",
        "positive",
        "positive",
      ][index],
      detailedRatings: reviewDetails[index],
      comment: reviewComments[index],
      images: [],
      isVerifiedPurchase: true,
    }));
    await Review.insertMany(reviewsToInsert);

    for (const listing of insertedListings) {
      const listingReviews = reviewsToInsert.filter(
        (review) => review.listingId.toString() === listing._id.toString(),
      );
      if (listingReviews.length > 0) {
        const averageRating =
          listingReviews.reduce((total, review) => total + review.rating, 0) /
          listingReviews.length;
        listing.reviews = {
          averageRating: Math.round(averageRating * 10) / 10,
          reviewCount: listingReviews.length,
        };
        await listing.save();
      }
    }

    const feedbackOrders = await Order.insertMany(
      insertedListings
        .slice(6)
        .map((listing) =>
          buildOrderData({ buyer, seller, listing, isReviewed: false }),
        ),
    );

    // Every request needs its own delivered order to hang off
    const disputeOrders = await Order.insertMany(
      disputeScenarios.map((scenario, index) => ({
        ...buildOrderData({
          buyer,
          seller,
          listing: insertedListings[index % insertedListings.length],
          isReviewed: false,
        }),
        sellerConfirmed: true,
        sellerConfirmedAt: daysAgo(scenario.openedDaysAgo + 5),
      })),
    );

    // timestamps: false keeps the backdated createdAt/updatedAt we built above
    const insertedDisputes = await Dispute.insertMany(
      disputeScenarios.map((scenario, index) =>
        buildDisputeData({
          buyer,
          seller,
          order: disputeOrders[index],
          scenario,
        }),
      ),
      { timestamps: false },
    );

    console.log(`Inserted ${insertedListings.length} listings`);
    console.log(`Inserted ${reviewsToInsert.length} sample reviews`);
    console.log(
      `Inserted ${feedbackOrders.length} delivered orders awaiting feedback`,
    );
    console.log(
      `Inserted ${insertedDisputes.length} buyer requests (disputes) with ${disputeOrders.length} matching orders`,
    );
    console.log("Demo accounts:");
    console.log("  buyer.demo@ebay.local / 123456");
    console.log("  seller.demo@ebay.local / 123456");
    console.log("Review test URLs:");
    feedbackOrders.forEach((order) => {
      console.log(`  http://localhost:3000/review/${order._id}`);
    });
    console.log("Requests seeded by status:");
    insertedDisputes.forEach((dispute) => {
      console.log(
        `  ${dispute.status.padEnd(18)} ${dispute.reason.padEnd(20)} http://localhost:3000/disputes/${dispute._id}`,
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error.message);
    process.exit(1);
  }
};

seed();
