import { Contract, providers, utils, BigNumber } from "ethers";
import {EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI} from "../constants";

export const removeLiquidity = async(signer, removeLPTokensWei)=>{
  const exchangeContract = new Contract(EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ABI, signer);
  const tx = await exchangeContract.removeLiquidity(removeLPTokensWei);
  await tx.wait();
};

export const getTokensAfterRemove = async(provider, removeLPTokensWei, _ethBalance, azogDevTokenReserve)=>{
  try{
    const exchangeContract = new Contract(EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ABI, provider);
    const _totalSupply = await exchangeContract.totalSupply();
    const _removeEther = _ethBalance.mul(removeLPTokensWei).div(_totalSupply);
    const _removeAZD = azogDevTokenReserve.mul(removeLPTokensWei).div(_totalSupply);
    return{
      _removeEther,
      _removeAZD,
    };
  } catch(err){
    console.log(err);
  }
};
