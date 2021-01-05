import 'regenerator-runtime/runtime'
import React, { useEffect, useState } from 'react'

import * as nearApiJs from 'near-api-js'
import { BrowserLocalStorageKeyStore } from 'near-api-js/lib/key_stores'

import getConfig from './config'
const { networkId, nodeUrl, walletUrl } = getConfig(process.env.NODE_ENV)

const {
  KeyPair,
  InMemorySigner,
  transactions: {
      addKey
  },
  utils: {
      PublicKey,
      format: {
          parseNearAmount, formatNearAmount
      }
  }
} = nearApiJs

const ENTRY_FEE = '2'

export default function App() {

  const[loaded, setLoaded] = useState(false)
  const[currentAccount, setCurrentAccount] = useState()
  const[accountBalance, setAccountBalance] = useState()
  const[keyType, setKeyType] = useState()
  const[contract, setContract] = useState()
  const[prizePool, setPrizePool] = useState()
  const[entered, setEntered] = useState(false)
  const[errorMessage, setErrorMessage] = useState()
  const[viewWinnings, setViewWinnings] = useState(false)
  const[stealWinnings, setStealWinnings] = useState(false)

 

  useEffect(
    () => {
          async function fetchData() {
            try {
              let result = await contract.isEntered({account: currentAccount.accountId})
              result ? setEntered(true) : setEntered(false)
              let result1 = await contract.getPrizePoolBalance({})
              result1 ? setPrizePool(result1) : setPrizePool()
             
              return true
            } catch (err) {
              err.message = 'Become a Player to Continue'
             
              return false
            }
          }

          fetchData()
            .then((res) => {
              res ? setLoaded(true) : setLoaded(false)
            })
    }, [currentAccount, contract, loaded, entered, prizePool]
  )

  async function useFullAccessKey() {
    // switch statement to ensure we're using the right private key with the currentAccount
    let private_key
    switch(currentAccount.accountId) {
      case process.env.PLAYER1:
        private_key = process.env.PLAYER1_PRIV_KEY
        break
      case process.env.PLAYER2:
        private_key = process.env.PLAYER2_PRIV_KEY
        break
      case process.env.PLAYER3:
        private_key = process.env.PLAYER3_PRIV_KEY
        break
      default:
        private_key = process.env.PLAYER1_PRIV_KEY
    }

    // Step 1:  get the keypair from the account's full access private key
    let keyPair = KeyPair.fromString(private_key)

    // Step 2:  load up an inMemorySigner using the keyPair for the account
    let signer = await InMemorySigner.fromKeyPair(networkId, currentAccount.accountId, keyPair)

    // Step 3:  create a connection to the network using the signer's keystore and default config for testnet
    const near = await nearApiJs.connect({
      networkId, nodeUrl, walletUrl, deps: { keyStore: signer.keyStore },
    })

    // Step 4:  get the account object of the currentAccount.  At this point, we should have full control over the account.
    let account = new nearApiJs.Account(near.connection, currentAccount.accountId)
    setCurrentAccount(account)
   
    // initiate the contract so its associated with this current account and exposing all the methods
    let contract = new nearApiJs.Contract(account, process.env.CONTRACT_NAME, {
      viewMethods: ['viewWinnings', 'isEntered', 'getPrizePoolBalance'],
      changeMethods: ['enterCompetition', 'withdrawWinnings', 'stealWinnings', 'reset']
    })
    setContract(contract)
    setKeyType('FullAccess')
    return contract
  }

  async function useContractFullAccessKey() {    

    // Step 1:  get the keypair from the contract's full access private key
    let keyPair = KeyPair.fromString(process.env.CONTRACT_PRIV_KEY)

    // Step 2:  load up an inMemorySigner using the keyPair for the account
    let signer = await InMemorySigner.fromKeyPair(networkId, process.env.CONTRACT_NAME, keyPair)

    // Step 3:  create a connection to the network using the signer's keystore and default config for testnet
    const near = await nearApiJs.connect({
      networkId, nodeUrl, walletUrl, deps: { keyStore: signer.keyStore },
    })

    // Step 4:  get the account object of the currentAccount.  At this point, we should have full control over the account.
    let account = new nearApiJs.Account(near.connection, process.env.CONTRACT_NAME)
   
    // initiate the contract so its associated with this current account and exposing all the methods
    let contract = new nearApiJs.Contract(account, process.env.CONTRACT_NAME, {
      viewMethods: ['getPrizePoolBalance'],
      changeMethods: ['withdrawWinnings', 'reset']
    })
    setContract(contract)
    setKeyType('Contract FullAccess')
    return contract
  }

  async function useFunctionAccessKey() {

    let keystore = new BrowserLocalStorageKeyStore(localStorage, 'competition:')
    
    // Step 1:  get the keypair from the account's localstorage private key we set earlier
    let keyPair = await keystore.getKey(networkId, currentAccount.accountId)
   // let keyPair = KeyPair.fromString(private_key)

    // Step 2:  load up an inMemorySigner using the keyPair for the account
    let signer = await InMemorySigner.fromKeyPair(networkId, currentAccount.accountId, keyPair)

    // Step 3:  create a connection to the network using the signer's keystore and default config for testnet
    const near = await nearApiJs.connect({
      networkId, nodeUrl, walletUrl, deps: { keyStore: signer.keyStore },
    })

    // Step 4:  get the account object of the currentAccount.  At this point, we should have full control over the account.
    let account = new nearApiJs.Account(near.connection, currentAccount.accountId)
    setCurrentAccount(account)
   
    // initiate the contract so its associated with this current account and exposing all the methods
    let contract = new nearApiJs.Contract(account, process.env.CONTRACT_NAME, {
      viewMethods: ['viewWinnings', 'isEntered', 'getPrizePoolBalance'],
      changeMethods: ['enterCompetition', 'withdrawWinnings', 'stealWinnings', 'reset']
    })
    setContract(contract)
    setKeyType('FunctionAccess')
    return contract
  }

  async function setPlayerAccountFunctionCallKey() {
  
    // switch statement to ensure we're using the right private key with the currentAccount
    let private_key
    switch(currentAccount.accountId) {
      case process.env.PLAYER1:
        private_key = process.env.PLAYER1_PRIV_KEY
        break
      case process.env.PLAYER2:
        private_key = process.env.PLAYER2_PRIV_KEY
        break
      case process.env.PLAYER3:
        private_key = process.env.PLAYER3_PRIV_KEY
        break
      default:
        private_key = process.env.PLAYER1_PRIV_KEY
    }
   
    // Step 1:  get the keypair from the account's full access private key
    let keyPair = KeyPair.fromString(private_key)

    // Step 2:  load up an inMemorySigner using the keyPair for the account
    let signer = await InMemorySigner.fromKeyPair(networkId, currentAccount.accountId, keyPair)

    // Step 3:  create a connection to the network using the signer's keystore and default config for testnet
    const near = await nearApiJs.connect({
      networkId, nodeUrl, walletUrl, deps: { keyStore: signer.keyStore },
    })

    // Step 4:  get the account object of the currentAccount.  At this point, we should have full control over the account.
    let account = new nearApiJs.Account(near.connection, currentAccount.accountId)
    setCurrentAccount(account)

    // Step 5: Make a new keyPair for the functioncall key
    let newKeyPair = KeyPair.fromRandom('ed25519')

    // Step 6:  Save it to local storage so its accessible again.  Prefixing with competition to be able to distinguish it.
    let keystore = new BrowserLocalStorageKeyStore(localStorage, 'competition:')
    keystore.setKey(networkId, currentAccount.accountId, newKeyPair)

    // Setting the methodNames on the contract we want this key to access
    const methodNames = ['enterCompetition', 'withdrawWinnings', 'reset']

    // allowance is how much NEAR this key can spend per transaction (0.25 is default)
    const allowance = parseNearAmount('0.25')

    // these are the actions we are going to execute - in this case add a function call access key for access.vitalpointai.testnet
    const actions = [
        //Action 1
        nearApiJs.transactions.addKey(
          newKeyPair.publicKey,
          nearApiJs.transactions.functionCallAccessKey(process.env.CONTRACT_NAME, methodNames, allowance)
        )
        //2nd Action would go here if we wanted to do more things in this call
    ]

    // this signs and sends the transaction
    await account.signAndSendTransaction(currentAccount.accountId, actions)
    setKeyType('FunctionCall Access')
  }

  async function setPlayer3ToSteal() {

    // Step 1:  get the keypair from the account's full access private key
    let keyPair = KeyPair.fromString(process.env.PLAYER3_PRIV_KEY)

    // Step 2:  load up an inMemorySigner using the keyPair for the account
    let signer = await InMemorySigner.fromKeyPair(networkId, process.env.PLAYER3, keyPair)

    // Step 3:  create a connection to the network using the signer's keystore and default config for testnet
    const near = await nearApiJs.connect(Object.assign({deps: { keyStore: signer.keyStore }}, getConfig(process.env.NODE_ENV)))

    // Step 4:  switch to using the account of the contract.  At this point, we can now control the contract as if we were the contract
    let account = new nearApiJs.Account(near.connection, process.env.PLAYER3)

    // Step 5: Make a new keyPair for the functioncall key
    let newKeyPair = KeyPair.fromRandom('ed25519')

    // Step 6:  Save it to local storage so its accessible again.
    let keystore = new BrowserLocalStorageKeyStore(localStorage, 'competition:')
    keystore.setKey(networkId, process.env.PLAYER3, newKeyPair)

    // Setting the methodNames on the contract we want this key to access
    const methodNames = ['stealWinnings']

    // allowance is how much NEAR this key can spend per transaction (0.25 is default)
    const allowance = parseNearAmount('0.25')

    // these are the actions we are going to execute - in this case add a function call access key for access.vitalpointai.testnet
    const actions = [
        //Action 1
        nearApiJs.transactions.addKey(
          newKeyPair.publicKey,
          nearApiJs.transactions.functionCallAccessKey(process.env.CONTRACT_NAME, methodNames, allowance)
        )
        //2nd Action would go here if we wanted to do more things in this call
    ]

    // this signs and sends the transaction
    await account.signAndSendTransaction(process.env.PLAYER3, actions)
  }

  async function changeAccount(playerAccount) {
    setErrorMessage()
    // load the browser keystore
    let keystore = new BrowserLocalStorageKeyStore(localStorage, 'competition:')

    // create a connection using the keystore and default config values for testnet
    const near = await nearApiJs.connect({
      networkId, nodeUrl, walletUrl, deps: { keyStore: keystore },
    })

    // load account of current player
    let account = new nearApiJs.Account(near.connection, playerAccount)
    setCurrentAccount(account)

    // load, set, format current account balance
    let balance = await account.getAccountBalance()
    setAccountBalance(formatNearAmount(balance.available, 2))

    // reset these two variables to false so we can see if they change
    setViewWinnings(false)
    setStealWinnings(false)
    
    // initiate the contract so its associated with this current account and exposing all the methods
    let contract = new nearApiJs.Contract(account, process.env.CONTRACT_NAME, {
      viewMethods: ['viewWinnings', 'isEntered', 'getPrizePoolBalance'],
      changeMethods: ['enterCompetition', 'withdrawWinnings', 'stealWinnings', 'reset']
    })
    setContract(contract)

     // load, set current prize pool
     let pool = await contract.getPrizePoolBalance({})
     setPrizePool(pool)

     setKeyType('FunctionCall Access')
  }

  async function enterCompetition() {
    setErrorMessage()
    let contract = await useFullAccessKey()
    try {
      let result = await contract.enterCompetition({
      }, process.env.DEFAULT_GAS_VALUE, parseNearAmount(ENTRY_FEE))

      if(result) {
        setEntered(true)
        changeAccount(currentAccount.accountId)
      }
    } catch (err) {
      console.log (err)
      setErrorMessage(err.message)
    }
  }

  async function withdrawWinnings() {
    setErrorMessage()
    let contract = await useContractFullAccessKey()
    try {
      let result = await contract.withdrawWinnings({
        player: currentAccount.accountId
      }, process.env.DEFAULT_GAS_VALUE, prizePool)

      if(result) {
        let result2 = await contract.getPrizePoolBalance({})
        setPrizePool(result2)
        let result3 = await contract.reset({
          player1: process.env.PLAYER1,
          player2: process.env.PLAYER2,
          player3: process.env.PLAYER3
        }, process.env.DEFAULT_GAS_VALUE)
        changeAccount(currentAccount.accountId)
      }

    } catch (err) {
      console.log (err)
      setErrorMessage(err.message)
    }
  }

  async function seeWinnings() {
    setErrorMessage()
    try {
      let result = await contract.viewWinnings({})
      if(result) {
        setViewWinnings(result)
      }
    } catch (err) {
      console.log (err)
      setErrorMessage(err.message)
    }
  }

  async function steal() {
    try {
      let result = await contract.stealWinnings({})
      if(result) {
        setStealWinnings(result)
      }
    } catch (err) {
      console.log (err)
      setErrorMessage(err.message)
    }
  }

  async function reset() {
    setErrorMessage()
    let contract = await useFunctionAccessKey()
    try {
      let result3 = await contract.reset({
        player1: process.env.PLAYER1,
        player2: process.env.PLAYER2,
        player3: process.env.PLAYER3
      }, process.env.DEFAULT_GAS_VALUE)
      changeAccount(currentAccount.accountId)
    } catch (err) {
      console.log (err)
      err.message = 'reset not successful'
      setErrorMessage(err.message)
    }
  }

  return (
    <>
    <div style ={{float:'left', width: '30%'}}>
      <h3>Status Window:</h3>
      <div>Current Player: {currentAccount ? currentAccount.accountId : 'choose a player'}</div>
      <div>Current Player Account Balance: {accountBalance ? accountBalance : 0}</div>
      <div>Entered: {entered ? 'Yes' : 'No'}</div>
      <div>Prize Pool: {formatNearAmount(prizePool)}</div>
      <div>Error Messages: {errorMessage}</div>
      <div>viewWinnings: {viewWinnings.toString()}</div>
      <div>stealWinnings: {stealWinnings.toString()}</div>
    </div>

    <div style ={{float:'left', width: '30%'}}>
      <h3>Actions</h3>
      <div>
      <button onClick={setPlayerAccountFunctionCallKey}>
        Assign Player Access
      </button>
      </div>
      <div>
      <button onClick={enterCompetition}>
        Enter Competition
      </button>
      </div>
      <div>
      <button onClick={seeWinnings}>
        View Winnings
      </button>
      </div>
      <div>
      <button onClick={withdrawWinnings}>
        Withdraw Winnings
      </button>
      </div>
      <div>
      <button onClick={reset}>
        Reset Game
      </button>
      </div>
      <div>
      <button onClick={setPlayer3ToSteal}>
        Set Player3 as Thief
      </button>
      </div>
      <div>
      <button onClick={steal}>
        Steal
      </button>
      </div>
    </div>

    <div style={{float: 'left', width: '30%'}}>
      <h3>Change Players</h3>
      <div>
        <button onClick={(e) => changeAccount(process.env.PLAYER1)}>
          Become Player 1
        </button>
      </div>
      <div>
        <button onClick={(e) => changeAccount(process.env.PLAYER2)}>
          Become Player 2
        </button>
      </div>
      <div>
        <button onClick={(e) => changeAccount(process.env.PLAYER3)}>
          Become Player 3
        </button>
      </div>
    </div>
    
    <div style={{clear: 'both', width: '60%'}}>
      <h3>Current Key Type: {keyType} </h3>
      <h4>Test It</h4>
    
      <ul>
        <li>
          <p>For each player - change to them (simulating you logging into the app as them) - then click the Assign Access button.
          You can then use near keys accountname from near-cli or your wallet to see that a functionCall access key was added to
          that account.</p>
        </li>
        <li>
          <p>For each player - change to them - then click the Enter Competition button.  The prize pool should increase in multiples
          of two and you should only be able to enter once for each player.  Current player account balance should decrease by two.</p>
        </li>
        <li>
          <p>Pick a player and simulating the contest ending - have them withdraw winnings.  You should see prize pool drop and that
          NEAR transferred to their account balance.  This will also reset the game allowing each player to enter again.  It does
          not delete the keys we assigned.</p>
        </li>
        <li>
          <p>Become player3 and click the button to make them the thief.  This will assigne them a functioncall key that allows them to 
          access the stealWinnings function.  Check the keys on the account to verify.  Clicking stealWinnings should change it to true
          if you are player3 and it will stay false if you are the other players (as they don't have the right access key).</p>
        </li>
      </ul> 
     
    </div>
    
    </>
    )
}
