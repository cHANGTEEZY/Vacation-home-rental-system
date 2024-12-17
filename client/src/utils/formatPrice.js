export const formatPrice = (price) => {
  return new Intl.NumberFormat("en-NP", { style: "decimal" }).format(price);
};
