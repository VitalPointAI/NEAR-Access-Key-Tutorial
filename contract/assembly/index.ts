import { Context, ContractPromiseBatch, storage, u128, PersistentMap, logging } from 'near-sdk-as'

// contract account
const CONTRACT = 'access.vitalpointai.testnet'

// going to store each person's entry fee in balances which maps their account name to their entry fee
const balances = new PersistentMap<string, u128>('b')

// Allows someone to enter our competition by sending more than 2 NEAR to the contract.
// This requires the account calling this function to have a fullAccess key so it can
// transfer NEAR (one of the 7 primitive actions).  Will return a true if it was successful.
//
export function enterCompetition(): bool {
  logging.log('Context predecessor: ' + Context.predecessor)
  logging.log('Context sender: ' + Context.sender)
  // this checks to make sure the attached deposit is greater than 2 NEAR, otherwise
  // the function fails with the error (like a require statement in Solidity)
  assert(u128.gt(Context.attachedDeposit, u128.from(2)), 'must send more than 2 NEAR')

  // confirm player hasn't already entered
  assert(!balances.contains(Context.sender), 'already entered')

  // this transfers the NEAR (attached deposit) from the user to the contract
  ContractPromiseBatch.create(CONTRACT)
    .transfer(Context.attachedDeposit)

  // sets player balance in the balances map
  balances.set(Context.sender, Context.attachedDeposit)

  // initiate prize pool if it doesn't currently exist
  if(!storage.get<u128>('prizePool')) {
    storage.set<u128>('prizePool', u128.Zero)
  }

  // add it to the prize pool
  let currentValue = storage.getSome<u128>('prizePool')
  let newValue = u128.add(currentValue, Context.attachedDeposit)
  storage.set<u128>('prizePool', newValue)
  
  return true
}

//  This function allows our winner to withdraw the prizePool amount from the contract
//  and send it to an account of their choice.  This requires the frontend to have 
//  access to the contract's private key so it can sign the transaction to transfer the 
//  funds (needs fullAccess).  Returns true if successful.

export function withdrawWinnings(player: string): bool {
  logging.log('Context predecessor: ' + Context.predecessor)
  logging.log('Context sender: ' + Context.sender)
  
  //  first we check to ensure the withdraw amount <= what is in the prize pool
  assert(u128.le(Context.attachedDeposit, storage.getSome<u128>('prizePool')), 'attempting to withdraw more than pool has')
  
  //  this transfers the NEAR from the attachedDeposit to the predecessor (player)
  //  Todo: check to see if we can replace attacheddeposit with prizePool amount.
  ContractPromiseBatch.create(player)
    .transfer(Context.attachedDeposit)

  // empty prizePool
  let currentValue = storage.getSome<u128>('prizePool')
  let newValue = u128.sub(currentValue, Context.attachedDeposit)
  storage.set<u128>('prizePool', newValue)

  return true
}

// The reset functions consist of a public function pointing to a private function that deletes 
// the player accounts from the persistent map, essentially resetting the game.  Gets called 
// when a player withdraws winnings
function _reset(player1: string, player2: string, player3: string): bool {
  balances.delete(player1)
  balances.delete(player2)
  balances.delete(player3)
  return true
}

export function reset(player1: string, player2: string, player3: string): bool {
  _reset(player1, player2, player3)
  return true
}

//  This function isn't going to do anything but return true if it gets successfully called.
//  We're not going to give the user account access to it to show how the functionCall keys 
//  work.
export function stealWinnings(): bool {
  storage.set<bool>('steal', true)
  return storage.getSome<bool>('steal')
}

//  This function doesn't change anything in storage, thus it's a viewMethod.  As you'll
//  see - anyone, regardless of keytypes or methodnames can call these/get the results.
//  It also does nothing interesting.
export function viewWinnings(): bool {
  return true
}

export function getPrizePoolBalance(): u128 {
  return storage.getSome<u128>('prizePool')
}

export function isEntered(account: string): bool {
  return balances.contains(account)
}