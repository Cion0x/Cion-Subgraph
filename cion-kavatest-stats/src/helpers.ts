import { BigInt, TypedMap } from "@graphprotocol/graph-ts"
import {
  ChainlinkPrice,
  UniswapPrice
} from "../generated/schema"

export let BASIS_POINTS_DIVISOR = BigInt.fromI32(10000)
export let PRECISION = BigInt.fromI32(10).pow(30)

export let WBTC = "0x7be89557B43D2A7270437976D98d017B87b0E466";
export let WETH = "0xC61C6Aa8C8Ed17c15d80eD7C6e8E06e817daDb4d";
export let WKAVA = "0xFa95D53e0B6e82b2137Faa70FD7E4a4DC70Da449";
export let USDC = "0x43D8814FdFB9B8854422Df13F1c66e34E4fa91fD";
export let USDT = "0xf3d7421f6D1358eCd92A00561cb2Cb3E1B9f4966";
export let DAI = "0xED033cD7B1E4C5F7999a459b4cF6179DBfb019C6";
export let CION = "0xd912629478109A9c64a96F5E506fC2f9c0E0D69e";

export function timestampToDay(timestamp: BigInt): BigInt {
  return timestampToPeriod(timestamp, "daily")
}

export function timestampToPeriod(timestamp: BigInt, period: string): BigInt {
  let periodTime: BigInt

  if (period == "daily") {
    periodTime = BigInt.fromI32(86400)
  } else if (period == "hourly") {
    periodTime = BigInt.fromI32(3600)
  } else if (period == "weekly" ){
    periodTime = BigInt.fromI32(86400 * 7)
  } else {
    throw new Error("Unsupported period " + period)
  }

  return timestamp / periodTime * periodTime
}

export function getTokenDecimals(token: String): u8 {
  let tokenDecimals = new Map<String, i32>()
  tokenDecimals.set(WBTC, 8)
  tokenDecimals.set(WETH, 18)
  tokenDecimals.set(WKAVA, 18)
  tokenDecimals.set(USDC, 6)
  tokenDecimals.set(USDT, 6)
  tokenDecimals.set(DAI, 18)
  tokenDecimals.set(CION, 18)

  return tokenDecimals.get(token) as u8
}

export function getTokenAmountUsd(token: String, amount: BigInt): BigInt {
  let decimals = getTokenDecimals(token)
  let denominator = BigInt.fromI32(10).pow(decimals)
  let price = getTokenPrice(token)
  return amount * price / denominator
}

export function getTokenPrice(token: String): BigInt {
  if (token != CION) {
    let chainlinkPriceEntity = ChainlinkPrice.load(token)
    if (chainlinkPriceEntity != null) {
      // all chainlink prices have 8 decimals
      // adjusting them to fit CION 30 decimals USD values
      return chainlinkPriceEntity.value * BigInt.fromI32(10).pow(22)
    }
  }

  if (token == CION) {
    let uniswapPriceEntity = UniswapPrice.load(CION)

    if (uniswapPriceEntity != null) {
      return uniswapPriceEntity.value
    }
  }

  let prices = new TypedMap<String, BigInt>()
  prices.set(WETH, BigInt.fromI32(1800) * PRECISION)
  prices.set(WBTC, BigInt.fromI32(25000) * PRECISION)
  prices.set(WKAVA, BigInt.fromI32(4) * PRECISION / BigInt.fromI32(10).pow(1))
  prices.set(USDC, PRECISION)
  prices.set(USDT, PRECISION)
  prices.set(DAI, PRECISION)
  prices.set(CION, BigInt.fromI32(5) * PRECISION / BigInt.fromI32(10).pow(3))

  return prices.get(token) as BigInt
}
