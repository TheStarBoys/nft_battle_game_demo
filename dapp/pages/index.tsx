import Head from 'next/head'
import Image from 'next/image'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import { useWeb3React } from "@web3-react/core"
import { Web3ReactProvider } from '@web3-react/core'
import { InjectedConnector } from '@web3-react/injected-connector'
import { BaseProvider, TransactionReceipt, TransactionRequest, Web3Provider } from '@ethersproject/providers'
import { useEffect, useState } from 'react'
import { Role } from '@/contracts/contracts/Role'
import { Role__factory } from '@/contracts/factories/contracts/Role__factory'

const inter = Inter({ subsets: ['latin'] })

interface RoleInfo {
  HP: number,
  ATK: number
}

function Home() {
  const { account, activate, active, library } = useWeb3React<Web3Provider>();
  const [roleContractAddr, setRoleContractAddr] = useState('');
  const [roleContract, setRoleContract] = useState<Role>();

  //// Game Info
  const [rolesInfo, setRolesInfo] = useState<Array<RoleInfo>>();
  
  useEffect(() => {
    if (!library) return;
    const signer = library.getSigner();
    setRoleContract(Role__factory.connect(roleContractAddr, signer));
  }, [roleContractAddr]);

  useEffect(() => {
    async function helper() {
      if (!roleContract) return;

      let roles = new Array<RoleInfo>();
      for (let i = 0; i < 3; i++) {
        const hp = await roleContract.callStatic.getRoleHP(i);
        const atk = await roleContract.callStatic.getRoleATK(i);
        roles.push({HP: hp.toNumber(), ATK: atk.toNumber()})
      }

      setRolesInfo(roles);
    }

    helper();
  }, [roleContract])

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
      <div>
        <span>Game Contract: </span>
        <input type="text" onChange={(e) => setRoleContractAddr(e.currentTarget.value)}></input>
      </div>
      <ul>
        {rolesInfo?.map((info, roleId) => (
          <li>roleId: {roleId} HP: {info.HP} ATK: {info.ATK}</li>
        ))}
      </ul>
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