import { BigInt, ethereum } from "@graphprotocol/graph-ts"

import {
  Swap as SwapEvent,
  IncreasePosition as IncreasePositionEvent,
  DecreasePosition as DecreasePositionEvent,
  LiquidatePosition as LiquidatePositionEvent,
} from "../generated/Vault2/Vault"

import {
  AddLiquidity as AddLiquidityEvent,
  RemoveLiquidity as RemoveLiquidityEvent,
} from "../generated/ClpManager/ClpManager"

import { getTokenAmountUsd } from "./helpers"

import { UserTVL, UserVolume } from "../generated/schema"

let ZERO = BigInt.fromI32(0)

export function handleAddLiquidity(event:AddLiquidityEvent): void {
  let volume = event.params.usdcAmount.times(BigInt.fromString("1000000000000"))
  _storeTVL(event.params.account.toHexString(), volume, event.block.timestamp, 'add')
  _storeVolume(event.params.account.toHexString(), volume, event.block.timestamp)
}

export function handleRemoveLiquidity(event:RemoveLiquidityEvent): void {
  let volume = event.params.usdcAmount.times(BigInt.fromString("1000000000000"))
  _storeTVL(event.params.account.toHexString(), volume, event.block.timestamp, 'remove')
  _storeVolume(event.params.account.toHexString(), volume, event.block.timestamp)
}

export function handleSwap(event: SwapEvent): void {
  let volume = getTokenAmountUsd(event.params.tokenIn.toHexString(), event.params.amountIn)
  _storeVolume(event.params.account.toHexString(), volume, event.block.timestamp)
}

export function handleIncreasePosition(event: IncreasePositionEvent): void {
  let volume = event.params.sizeDelta
  _storeVolume(event.params.account.toHexString(), volume, event.block.timestamp)
}

export function handleDecreasePosition(event: DecreasePositionEvent): void {
  let volume = event.params.sizeDelta
  _storeVolume(event.params.account.toHexString(), volume, event.block.timestamp)
}

export function handleLiquidatePosition(event: LiquidatePositionEvent): void {
  let volume = event.params.size
  _storeVolume(event.params.account.toHexString(), volume, event.block.timestamp)
}

function _getDayId(timestamp: BigInt): string {
  let dayTimestamp = timestamp.toI32() / 86400 * 86400
  return dayTimestamp.toString()
}

function _storeTVL(account: string, amount: BigInt, timestamp: BigInt, flag: string): void {
  let id = account + ":" + _getDayId(timestamp)
  let entity = UserTVL.load(id)
  if (entity === null) {
    entity = new UserTVL(id)
    entity.account = account
    entity.amount = ZERO
    entity.period = "daily"
  }

  entity.timestamp = timestamp.toI32()
  entity.amount = flag === "add" ? entity.amount.plus(amount) : entity.amount.minus(amount)
  entity.save()

  let totalEntity = UserTVL.load(account + ":total")
  if (totalEntity === null) {
    totalEntity = new UserTVL(account + ":total")
    totalEntity.account = account
    totalEntity.amount = ZERO
    totalEntity.period = "total"
  }

  totalEntity.timestamp = timestamp.toI32()
  totalEntity.amount = flag === "add" ? totalEntity.amount.plus(amount) : totalEntity.amount.minus(amount)
  totalEntity.save()
}

function _storeVolume(account: string, volume: BigInt, timestamp: BigInt): void {
  let id = account + ":" + _getDayId(timestamp)
  let entity = UserVolume.load(id)
  if (entity === null) {
    entity = new UserVolume(id)
    entity.account = account
    entity.volume = ZERO
    entity.period = "daily"
  }

  entity.timestamp = timestamp.toI32()
  entity.volume = entity.volume.plus(volume)
  entity.save()

  let totalEntity = UserVolume.load(account + ":total")
  if (totalEntity === null) {
    totalEntity = new UserVolume(account + ":total")
    totalEntity.account = account
    totalEntity.volume = ZERO
    totalEntity.period = "total"
  }

  totalEntity.timestamp = timestamp.toI32()
  totalEntity.volume = totalEntity.volume.plus(volume)
  totalEntity.save()
}
