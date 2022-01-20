-- AlterEnum
ALTER TYPE "TxStatus" ADD VALUE 'REQUIRES_REDIRECT';

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "checkoutUrl" TEXT;
