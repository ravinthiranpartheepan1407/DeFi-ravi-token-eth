import { Contract } from "ethers";
import { EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI } from "../constants";

export const getAmountOfTokenReceivedFromSwap = async(_swapAmountWei, provider, ethSelected, ethBalance, reservedAZD)=>{
    const exchangeContract = new Contract(EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ABI, provider);
    let amountOfTokens;
    if(ethSelected){
      amountOfTokens = await exchangeContract.getAmountOfToken(
        _swapAmountWei, ethBalance, reservedAZD
      );
    } else{
      amountOfTokens = await exchangeContract.getAmountOfToken(_swapAmountWei, reservedAZD, ethBalance);
    }
  return amountOfTokens;
};

export const swapTokens = async(signer, swapAmountWei, tokenToBeReceivedAfterSwap, ethSelected) => {
  const exchangeContract = new Contract(EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ABI, signer);
  const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer);

  let tx;
  if(ethSelected){
    tx = await exchangeContract.ethToAzogDevToken(tokenToBeReceivedAfterSwap,{
      value: swapAmountWei,
    });
  } else{
    tx = await tokenContract.approve(EXCHANGE_CONTRACT_ADDRESS, swapAmountWei.toString());
    await tx.wait();
    tx = await exchangeContract.azogDevTokenToEth(swapAmountWei, tokenToBeReceivedAfterSwap);
  }
  await tx.wait();
}
