import Head from 'next/head'
import Image from 'next/image'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import { useWeb3React } from "@web3-react/core"
import { Web3ReactProvider } from '@web3-react/core'
import { InjectedConnector } from '@web3-react/injected-connector'
import ethers from 'ethers';
import { BigNumber } from 'ethers'
import { BaseProvider, TransactionReceipt, TransactionRequest, Web3Provider } from '@ethersproject/providers'
import { MouseEventHandler, useEffect, useState } from 'react'
import { Role } from '@/contracts/contracts/Role'
import { Role__factory } from '@/contracts/factories/contracts/Role__factory'
import axios from 'axios'

const inter = Inter({ subsets: ['latin'] })

interface RoleInfo {
  RoleId: number,
  HP: number,
  ATK: number,
  Img: string
}

function RoleCard(
  props: {
    info: RoleInfo,
    onClick?: MouseEventHandler<HTMLDivElement>,
  }
) {
  return (
    <div onClick={props.onClick}>
      <img src={props.info.Img} height={100}></img>
      <span>RoleID: {props.info.RoleId} </span>
      <span>HP: {props.info.HP} </span>
      <span>ATK: {props.info.ATK} </span>
    </div>
  )
}

function Home() {
  const { account, activate, active, library } = useWeb3React<Web3Provider>();
  const [roleContractAddr, setRoleContractAddr] = useState('');
  const [roleContract, setRoleContract] = useState<Role>();
  const [yourTokenId, setYourTokenId] = useState<number>();
  const [yourRoleId, setYourRoleId] = useState<number>();
  const [yourHP, setYourHP] = useState<number>();
  const [yourATK, setYourATK] = useState<number>();
  const [yourImg, setYourImg] = useState<string>();

  const [enemyTokenId, setEnemyTokenId] = useState<number>();
  const [enemyRoleId, setEnemyRoleId] = useState<number>();
  const [enemyHP, setEnemyHP] = useState<number>();
  const [enemyATK, setEnemyATK] = useState<number>();
  const [enemyImg, setEnemyImg] = useState<string>();

  const [winner, setWinner] = useState<string>();
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
        // TODO: img
        roles.push({
          RoleId: i,
          HP: hp.toNumber(),
          ATK: atk.toNumber(),
          Img: await getRoleImg(i),
        })
      }

      setRolesInfo(roles);
    }

    helper();
  }, [roleContract])

  useEffect(() => {
    console.log(`Battle result, yourHP=${yourHP} enemyHP=${enemyHP}`);
    if (yourHP == 0) {
      console.log('set enemy as winner')
      setWinner('Enemy');
    } else if (enemyHP == 0) {
      console.log('set you as winner')
      setWinner('You');
    }
  }, [yourHP, enemyHP]);

  function connectWallet(event: React.MouseEvent) {
    event.preventDefault()
    const connector = new InjectedConnector({
      supportedChainIds: [1, 5, 31337],
    })
    !active && connector && activate(connector)
  }

  async function updateYourTokenStatus(tokenId: number) {
    const tokenInfo = await getTokenInfo(tokenId);
    setYourHP(tokenInfo?.HP);
    setYourATK(tokenInfo?.ATK);
    setYourImg(tokenInfo?.Img);
  }

  async function updateEnemyTokenStatus(tokenId: number) {
    const tokenInfo = await getTokenInfo(tokenId);
    setEnemyHP(tokenInfo?.HP);
    setEnemyATK(tokenInfo?.ATK);
    setEnemyImg(tokenInfo?.Img);
  }

  async function getRoleImg(roleId: number): Promise<string> {
    if (!roleContract) return '';
    const uri = await roleContract.roleIdToURI(roleId);
    console.log('request uri: ', uri);
    const resp = await axios.get<any, {data: {image: string}}>(uri);
    // console.log(resp.data.image);

    return resp.data.image;
  }

  function attackOther(event: React.MouseEvent) {
    event.preventDefault();
    async function helper() {
      if (!roleContract || !yourTokenId || !enemyTokenId) return;
      const tx = await roleContract.attack(yourTokenId, enemyTokenId);
      await tx.wait();

      await updateYourTokenStatus(yourTokenId)
      await updateEnemyTokenStatus(enemyTokenId)
    }

    helper();
  }

  async function getTokenInfo(tokenId: number): Promise<RoleInfo | undefined> {
    if (!roleContract) return;
    const roleId = await roleContract.tokenIdToRoleIds(tokenId);
    const hp = await roleContract.getHP(tokenId);
    const atk = await roleContract.getATK(tokenId);
    const img = await getRoleImg(roleId.toNumber());
    return {
      RoleId: roleId.toNumber(),
      HP: hp.toNumber(),
      ATK: atk.toNumber(),
      Img: img,
    }
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
      <div><span>Choose {!yourTokenId ? 'your favorite role for yourself' : 'your enemy'}:</span></div>
      <ul>
        {rolesInfo?.map((info, roleId) => (
          <RoleCard info={info} onClick={async (event: React.MouseEvent)=> {
            event.preventDefault();
            if (!roleContract) return;
            const tx = await roleContract.createRole(info.RoleId);
            const receipt = await tx.wait();
            const events = receipt.events?.find((v) => {
              return v.event == 'RoleCreated';
            })
            if (!events || !events.args) return;
            console.log('got RoleCreated: ', events.args['tokenId']);
            const tokenId = events.args['tokenId'];
            const tokenInfo = await getTokenInfo(tokenId)

            if (!yourTokenId) {
              setYourTokenId(tokenId);
              setYourRoleId(tokenInfo?.RoleId);
              await updateYourTokenStatus(tokenId);
            } else {
              setEnemyTokenId(events.args['tokenId']);
              setEnemyRoleId(tokenInfo?.RoleId);
              await updateEnemyTokenStatus(tokenId);
            }
          }}></RoleCard>
        ))}
      </ul>
      <div><span>You</span></div>
      {
        yourTokenId ? <RoleCard info={{
          RoleId: yourRoleId ? yourRoleId : 0,
          HP: yourHP ? yourHP : 0,
          ATK: yourATK ? yourATK : 0,
          Img: yourImg ? yourImg : '',
        }}></RoleCard> : <></>
      }

      <div><span>Enemy</span></div>
      {
        enemyTokenId ? <RoleCard info={{
          RoleId: enemyRoleId ? enemyRoleId : 0,
          HP: enemyHP ? enemyHP : 0,
          ATK: enemyATK ? enemyATK : 0,
          Img: enemyImg ? enemyImg : '',
        }} onClick={attackOther}></RoleCard> : <></>
      }

      <div><span> Winner is : {winner ? winner : 'Unknown'} !!!</span></div>

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