module.exports =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        message: `Chỉ ${roles.join("/")} mới có quyền thực hiện hành động này`,
      });
    }
    next();
  };
