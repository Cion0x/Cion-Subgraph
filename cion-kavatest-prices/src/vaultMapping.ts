import { BigInt, ethereum } from "@graphprotocol/graph-ts"

import {
  BuyUSDC as BuyUSDCEvent,
  SellUSDC as SellUSDCEvent,
  Swap as SwapEvent,
  IncreasePosition as IncreasePositionEvent,
  DecreasePosition as DecreasePositionEvent,
  // ClosePosition as ClosePositionEvent,
  LiquidatePosition as LiquidatePositionEvent,
} from "../generated/Vault2/Vault"

import { getTokenAmountUsd } from "./helpers"

import { Volume } from "../generated/schema"

let ZERO = BigInt.fromI32(0)

function _getIdFromEvent(event: ethereum.Event): string {
  return event.transaction.hash.toHexString() + ':' + event.logIndex.toString()
}

export function handleBuyUSDC(event: BuyUSDCEvent): void {
  let volume = event.params.usdcAmount * BigInt.fromString("1000000000000")
  _storeVolume(_getIdFromEvent(event), event.params.token.toHexString(), event.block.timestamp, "BuyUSDC", volume)
}

export function handleSellUSDC(event: SellUSDCEvent): void {
  let volume = event.params.usdcAmount * BigInt.fromString("1000000000000")
  _storeVolume(_getIdFromEvent(event), event.params.token.toHexString(), event.block.timestamp, "SellUSDC", volume)
}

export function handleSwap(event: SwapEvent): void {
  let volume = getTokenAmountUsd(event.params.tokenIn.toHexString(), event.params.amountIn)
  _storeVolume(_getIdFromEvent(event), event.params.tokenIn.toHexString(), event.block.timestamp, "Swap", volume)
}

export function handleIncreasePosition(event: IncreasePositionEvent): void {
  let volume = event.params.sizeDelta
  let action = event.params.isLong ? "IncreasePosition-Long" : "IncreasePosition-Short"
  _storeVolume(_getIdFromEvent(event), event.params.indexToken.toHexString(), event.block.timestamp, action, volume)
}

export function handleDecreasePosition(event: DecreasePositionEvent): void {
  let volume = event.params.sizeDelta
  let action = event.params.isLong ? "DecreasePosition-Long" : "DecreasePosition-Short"
  _storeVolume(_getIdFromEvent(event), event.params.indexToken.toHexString(), event.block.timestamp, action, volume)
}

export function handleLiquidatePosition(event: LiquidatePositionEvent): void {
  let volume = event.params.size
  let action = event.params.isLong ? "LiquidatePosition-Long" : "LiquidatePosition-Short"
  _storeVolume(_getIdFromEvent(event), event.params.indexToken.toHexString(), event.block.timestamp, action, volume)
}

function _storeVolume(id: string, token: string, timestamp: BigInt, action: string, volume: BigInt): void {
  let entity = Volume.load(id)
  if (entity === null) {
    entity = new Volume(id)
  }

  entity.token = token
  entity.timestamp = timestamp.toI32()
  entity.action = action
  entity.volume = volume
  entity.save()

  let totalEntity = Volume.load(token + ":" + action)
  if (totalEntity === null) {
    totalEntity = new Volume(token + ":" + action)
    totalEntity.token = token
    totalEntity.action = action
    totalEntity.volume = ZERO
  }

  totalEntity.timestamp = timestamp.toI32()
  totalEntity.volume = totalEntity.volume + volume
  totalEntity.save()
}
