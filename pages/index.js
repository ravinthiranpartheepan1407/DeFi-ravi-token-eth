import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import React,{useEffect, useState, useRef} from "react";
import Web3Modal from "web3modal";
import {BigNumber, utils, providers} from "ethers";
import {addLiquidity, calculateAZD} from "../utils/addLiquidity";
import {getAZDTokensBalance, getEtherBalance, getLPTokensBalance, getReserveOfAZDTokens} from "../utils/getAmount";
import {getTokensAfterRemove, removeLiquidity} from "../utils/removeLiquidity";
import {swapTokens, getAmountOfTokenReceivedFromSwap} from "../utils/swap";
import { useRouter } from 'next/router';
import Header from "./Header";
import Footer from "./Footer";

export default function Home() {

  const router = useRouter();
  const[loading, setLoading] = useState(false);
  const[liquidityTab, setLiquidityTab] = useState(true);
  const zero = BigNumber.from(0);
  const[ethBalance, setEtherBalance] = useState(zero);
  const[reservedAZD, setReservedAZD] = useState(zero);
  const[etherBalanceContract, setEtherBalanceContract] = useState(zero);
  const[azdBalance, setAZDBalance] = useState(zero);
  const[lpBalance, setLPBalance] = useState(zero);
  const[addEther, setAddEther] = useState(zero);
  const[addAZDTokens, setAddAZDTokens] = useState(zero);
  const[removeEther, setRemoveEther] = useState(zero);
  const[removeAZD, setRemoveAZD] = useState(zero);
  const[removeLPTokens, setRemoveLPTokens] = useState("0");
  const[swapAmount, setSwapAmount] = useState("");
  const[tokenToBeReceivedAfterSwap, setTokenToBeReceivedAfterSwap] = useState(zero);
  const[ethSelected, setEthSelected] = useState(true);
  const web3Refs = useRef();
  const[walletConnected, setWalletConnected] = useState(false);

  const getAmounts = async()=>{
    try{
      const provider = await getProviderOrSigner();
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      const _ethBalance = await getEtherBalance(provider, address);
      const _azdBalance = await getAZDTokensBalance(provider, address);
      const _lpBalance = await getLPTokensBalance(provider, address);
      const _reservedAZD = await getReserveOfAZDTokens(provider);
      const _ethBalanceContract = await getEtherBalance(provider, null, true);
      setEthSelected(_ethBalance);
      setAZDBalance(_azdBalance);
      setLPBalance(_lpBalance);
      setReservedAZD(_reservedAZD);
      setEtherBalanceContract(_ethBalanceContract);
    } catch(err){
      console.log(err);
    }
  };

  const _swapTokens = async()=>{
    try{
      const swapAmountWei = utils.parseEther(swapAmount);
      if(!swapAmountWei.eq(zero)){
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        await swapTokens(signer, swapAmountWei, tokenToBeReceivedAfterSwap, ethSelected);
        setLoading(false);
        await getAmounts();
        setSwapAmount("");
      }
    } catch(err){
      console.log(err);
      setLoading(false);
      setSwapAmount("");
    }
  };

  const _getAmountOfTokensToBeReceivedFromSwap = async(_swapAmount)=>{
    try{
      const _swapAmountWEI = utils.parseEther(_swapAmount.toString());
      if(!swapAmountWEI.eq(zero)){
        const provider = await getProviderOrSigner();
        const _ethBalance = await getEtherBalance(provider, null, true);
        const amountOfTokens = await getAmountOfTokenReceivedFromSwap(
          _swapAmountWEI,
          provider,
          ethSelected,
          _ethBalance,
          reservedAZD
        );
        setTokenToBeReceivedAfterSwap(amountOfTokens);
      } else{
        setTokenToBeReceivedAfterSwap(zero);
      }
    } catch(err){
      console.log(err);
    }
  };

  const _addLiquidity = async()=>{
    try{
      const addEtherWei = utils.parseEther(addEther.toString());
      if(!addAZDTokens.eq(zero) && !addEtherWei.eq(zero)){
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        await addLiquidity(signer, addAZDTokens, addEtherWei);
        setLoading(false);
        setAddAZDTokens(zero);
        await getAmounts();
      } else{
        setAddAZDTokens(zero);
      }
    } catch(err){
      console.log(err);
      setLoading(false);
      setAddAZDTokens(zero);
    }
  };

  const _removeLiquidity = async()=>{
    try{
      const signer = await getProviderOrSigner(true);
      const removeLPTokensWei = utils.parseEther(removeLPTokens);
      setLoading(true);
      await removeLiquidity(signer, removeLPTokens);
      setLoading(false);
      await getAmounts();
      setRemoveAZD(zero);
      setRemoveEther(zero);
    } catch(err){
      console.log(err);
      setLoading(false);
      setRemoveAZD(zero);
      setRemoveEther(zero);
    }
  };

  const _getTokensAfterRemove = async(_removeLPTokens) => {
    try{
      const provider = await getProviderOrSigner();
      const removeLPTokens = utils.parseEther(_removeLPTokens);
      const _ethBalance = await getEtherBalance(provider, null, true);
      const azogDevTokenReserve = await getReserveOfAZDTokens(provider);
      const{_removeEther, _removeAZD} = await getTokensAfterRemove(provider, removeLPTokensWei, _ethBalance, azogDevTokenReserve);
      setRemoveEther(_removeEther);
      setRemoveAZD(_removeAZD);
    } catch(err){
      console.log(err);
    }
  };

  const connectWallet = async()=>{
    try{
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch(err){
      console.log(err);
    }
  };

  const getProviderOrSigner = async(needSigner = false)=>{
    const provider = await web3Refs.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const{chainId} = await web3Provider.getNetwork();
    if(chainId!==4){
      window.alert("Switch to rinkeby");
      throw new Error("Switch to rinkeby");
    }
    if(needSigner){
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  useEffect(()=>{
    if(!walletConnected){
      web3Refs.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getAmounts();
    }
  }, [walletConnected]);

  const renderButton = ()=>{
    if(!walletConnected){
      return(
        <div>
          <button className="grid grid-cols-1 text-white gap-4 p-8 text-2xl max-w-sm rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 bg-rose-900 dark:border-gray-700 dark:hover:bg-gray-700" onClick={connectWallet}>Connect Your Wallet </button>
        </div>
      );
    }
    if(loading){
      return(<div><button className="grid grid-cols-2 p-15 text-white gap-4 p-6 max-w-sm rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 bg-rosie-900 dark:border-gray-700 dark:hover:bg-gray-700">Loading...</button></div>);
    }
    if(liquidityTab){
      return(
        <div>

          <div className="text-white">
            {utils.parseEther(reservedAZD.toString()).eq(zero) ? (
              <div className="grid grid-cols-1 gap-4">
                <input className="block p-6 max-w-sm  rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" type="number" placeholder="Amount of Ether" onChange={(e)=>setAddEther(e.target.value || "0")} />
                <input className="block p-6 max-w-sm  rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" type="number" placeholder="Amount of AzogDev Tokens" onChange={(e)=>setAddAZDTokens(BigNumber.from(utils.parseEther(e.target.value || "0")))} />
                <button className="block p-6 max-w-sm  rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 bg-rose-900 dark:border-gray-700 dark:hover:bg-gray-700" onClick={_addLiquidity}> Add Liquidity </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <input className="block p-6 max-w-sm  rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                  type="number"
                  placeholder="Amount of Ether"
                  onChange={async (e) => {
                    setAddEther(e.target.value || "0");
                    const _addAZDTokens = await calculateAZD(
                      e.target.value || "0",
                      etherBalanceContract,
                      reservedAZD
                    );
                    setAddAZDTokens(_addAZDTokens);
                  }}
                />
                <div className="block p-6 max-w-sm  rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 bg-rose-900 dark:border-gray-700 dark:hover:bg-gray-700">
                  {`You will need ${utils.formatEther(addAZDTokens)} Azog Dev
                  Tokens`}
                </div>
                <button onClick={_addLiquidity}>
                  Add
                </button>

              </div>
            )}
            <div className="grid grid-cols-1 gap-4">
            <br />
            <br />
              <input className="block p-6 max-w-sm  rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                type="number"
                placeholder="Amount of LP Tokens"
                onChange={async (e) => {
                  setRemoveLPTokens(e.target.value || "0");
                  await _getTokensAfterRemove(e.target.value || "0");
                }}
              />
              <div className="block p-6 max-w-sm  rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
                {`You will get ${utils.formatEther(removeAZD)} Azog
              Dev Tokens and ${utils.formatEther(removeEther)} Eth`}
              </div>
              <button className="block p-6 max-w-sm  rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 bg-rose-900 dark:border-gray-700 dark:hover:bg-gray-700" onClick={_removeLiquidity}>
                Remove
              </button>
            </div>
          </div>

        </div>
      );
    } else {
      return (
        <div className="grid grid-cols-3 gap-4">
          <input className="block p-6 max-w-sm  rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
            type="number"
            placeholder="Amount"
            onChange={async (e) => {
              setSwapAmount(e.target.value || "");
              await _getAmountOfTokensReceivedFromSwap(e.target.value || "0");
            }}
            value={swapAmount}
          />
          <select className="block p-6 max-w-sm text-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
            name="dropdown"
            id="dropdown"
            onChange={async () => {
              setEthSelected(!ethSelected);
              await _getAmountOfTokensReceivedFromSwap(0);
              setSwapAmount("");
            }}
          >
            <option className="text-white" value="eth">Ethereum</option>
            <option className="text-white" value="AzogDevToken">Azog Dev Token</option>
          </select>
          <br />
          <div className="block p-6 max-w-sm text-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
            {ethSelected
              ? `You will get ${utils.formatEther(
                  tokenToBeReceivedAfterSwap
                )} Azog Dev Tokens`
              : `You will get ${utils.formatEther(
                  tokenToBeReceivedAfterSwap
                )} Eth`}
          </div>
          <button className="block p-6 max-w-sm text-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 bg-rose-900 dark:border-gray-700 dark:hover:bg-gray-700" onClick={_swapTokens}>
            Swap
          </button>
        </div>
      );
    }
  };

  return (
    <div>
    <Header />
    <br />
    <br />
      <div>
        <div  className="grid grid-cols-4 gap-4">
          <h1 className="p-8 block text-white p-6 max-w-sm  rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">Welcome to Azog Devs DeFi Exchange!</h1>
          <div className="p-8 block text-white p-6 max-w-sm  rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
            Exchange Ethereum Azog Dev Tokens
          </div>
          <div>
            <div className="grid grid-cols-2 p-15 text-white gap-4 p-6 max-w-sm rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
            {utils.formatEther(azdBalance)} Azog Dev Tokens
            </div>
            <br />
            <div className="grid grid-cols-2 p-15 text-white gap-4 p-6 max-w-sm rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
            {utils.formatEther(ethBalance)} ethers
            </div>
            <br />
            <div className="grid grid-cols-2 p-15 text-white gap-4 p-6 max-w-sm rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
            {utils.formatEther(lpBalance)} Azog Dev LP Tokens
            </div>
          </div>
          <div className="grid grid-cols-2 p-15 text-white gap-4 p-6 max-w-sm rounded-lg border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700">
            <button className="grid grid-cols-2 p-15 text-white gap-4 p-6 max-w-sm rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 bg-rosie-900 dark:border-gray-700 dark:hover:bg-gray-700" onClick={()=>router.push('https://dao-v1-ravi.vercel.app/')}> DAO </button>
            <button className="grid grid-cols-2 p-15 text-white gap-4 p-6 max-w-sm rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 bg-rosie-900 dark:border-gray-700 dark:hover:bg-gray-700" onClick={()=>router.push('https://minted-dao-ravi-ravinthiranpartheepan1407.vercel.app/')}> NFT_Mint </button>
            <button className="grid grid-cols-2 p-15 text-white gap-4 p-6 max-w-sm rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 bg-rosie-900 dark:border-gray-700 dark:hover:bg-gray-700" onClick={()=>router.push('https://ico-ravi-azd-token.vercel.app/')}> ICO </button>
            <button className="grid grid-cols-2 p-15 text-white gap-4 p-6 max-w-sm rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 bg-rosie-900 dark:border-gray-700 dark:hover:bg-gray-700" onClick={()=>router.push('https://minter-app-ravinthiranpartheepan1407.vercel.app/')}> DAO(V2) </button>

          </div>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-8 block text-white p-6 max-w-sm  rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
              onClick={() => {
                setLiquidityTab(!liquidityTab);
              }}
            >
              Liquidity
            </button>
            <button className="p-8 block text-white p-6 max-w-sm  rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
              onClick={() => {
                setLiquidityTab(false);
              }}
            >
              Swap
            </button>
          </div>
          {renderButton()}
        </div>

      </div>
      <br />
      <br />
      <Footer />
    </div>
  );
}
