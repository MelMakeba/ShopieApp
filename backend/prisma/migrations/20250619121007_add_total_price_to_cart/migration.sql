/*
  Warnings:

  - Added the required column `price` to the `cart_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cart_items" ADD COLUMN     "price" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "carts" ADD COLUMN     "totalPrice" DECIMAL(10,2) NOT NULL DEFAULT 0;
