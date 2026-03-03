const generateOrderId = () => {
  const random = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  return `ORD-${year}-${random}`;
};

module.exports = generateOrderId;