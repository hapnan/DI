/**
 * Pricing logic based on user roles
 *
 * Business rules:
 * - Abu sells to Ijo: 100 per seed
 * - Ijo sells to Ultra/Raden: 200 per seed
 * - Ultra/Raden: Standard price 700 per seed
 */

export type UserRole = "Raden" | "Ultra" | "Ijo" | "Abu";

export function getSeedPriceByRole(role: UserRole): number {
  switch (role) {
    case "Abu":
      return 100; // Abu sells to Ijo at 100
    case "Ijo":
      return 200; // Ijo sells to Ultra/Raden at 200
    case "Ultra":
      return 300; // Standard price for higher roles
    case "Raden":
      return 300; // Standard price for higher roles
    default:
      return 300;
  }
}

export function getLeafPriceByRole(role: UserRole): number {
  // Leaf purchases follow similar pricing structure
  switch (role) {
    case "Abu":
      return 200; // Abu buys from Ijo at lower price
    case "Ijo":
      return 300; // Ijo standard price
    case "Ultra":
      return 300; // Standard price for higher roles
    case "Raden":
      return 300; // Standard price for higher roles
    default:
      return 300;
  }
}

export function calculateTotalPrice(
  quantity: number,
  pricePerUnit: number,
): number {
  return quantity * pricePerUnit;
}
