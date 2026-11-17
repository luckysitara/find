/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
    NEXT_PUBLIC_SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK || process.env.SOLANA_NETWORK || 'mainnet-beta',
    NEXT_PUBLIC_SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || process.env.SOLANA_RPC_URL || '',
    NEXT_PUBLIC_MERCHANT_WALLET: process.env.NEXT_PUBLIC_MERCHANT_WALLET || process.env.MERCHANT_WALLET || '',
    NEXT_PUBLIC_PRICE_INVESTIGATOR_MONTHLY: process.env.NEXT_PUBLIC_PRICE_INVESTIGATOR_MONTHLY || process.env.INVESTIGATOR_MONTHLY || '',
    NEXT_PUBLIC_PRICE_INVESTIGATOR_YEARLY: process.env.NEXT_PUBLIC_PRICE_INVESTIGATOR_YEARLY || process.env.INVESTIGATOR_YEARLY || '',
    NEXT_PUBLIC_PRICE_PRO_MONTHLY: process.env.NEXT_PUBLIC_PRICE_PRO_MONTHLY || process.env.PRICE_PRO_MONTHLY || '',
    NEXT_PUBLIC_PRICE_PRO_YEARLY: process.env.NEXT_PUBLIC_PRICE_PRO_YEARLY || process.env.PRICE_PRO_YEARLY || '',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig

