import { commerce } from "faker";

const productCount = 40;
export const products = Array(productCount).fill("").map((_, index: number) => ({
  id: index,
  productName: commerce.productName(),
  department: commerce.department()
}))