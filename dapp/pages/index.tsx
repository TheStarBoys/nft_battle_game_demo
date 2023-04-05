import Head from 'next/head'
import Image from 'next/image'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import { useWeb3React } from "@web3-react/core"
import { Web3ReactProvider } from '@web3-react/core'
import { InjectedConnector } from '@web3-react/injected-connector'
import { BaseProvider, TransactionReceipt, TransactionRequest, Web3Provider } from '@ethersproject/providers'
import { useState } from 'react'

const inter = Inter({ subsets: ['latin'] })

function Home() {
  const { account, activate, active, library } = useWeb3React<Web3Provider>()

  function connectWallet(event: React.MouseEvent) {
    event.preventDefault()
    const connector = new InjectedConnector({
      supportedChainIds: [1, 5, 31337],
    })
    !active && connector && activate(connector)
  }

  return (
    <>
      <Head>
        <title>NFT Battle Game Demo</title>
        <meta name="description" content="An NFT battle game demo written by TheStarBoys" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div><span>Address: {account ? account : 'Unknown'}</span></div>
      <div><span>Network: {library?.network.chainId}</span></div>
      
      <button onClick={connectWallet}>
        {active ? 'disconnect' : 'connect'} wallet
      </button>
      <main className={styles.main}>
        <h1>Hello World!!!</h1>
      </main>
    </>
  )
}

export default function App() {
  return (
    <Web3ReactProvider getLibrary={(provider, connector) => {
      return new Web3Provider(
        provider,
        typeof provider.chainId === 'number'
          ? provider.chainId
          : typeof provider.chainId === 'string'
          ? parseInt(provider.chainId)
          : 'any'
      )
    }}>
      <Home></Home>
    </Web3ReactProvider>
  );
}