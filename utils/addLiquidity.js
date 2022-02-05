import{ Contract, utils } from "ethers";
import { EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI } from "../constants";

export const addLiquidity = async(signer, addAZDAmountWei, addEtherAmountWei) => {
  try{
    const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer);
    const exchangeContract = new Contract(EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ABI, signer);
    let tx = await tokenContract.approve(EXCHANGE_CONTRACT_ADDRESS, addAZDAmountWei.toString());
    await tx.wait();
    tx = await exchangeContract.addLiquidity(addAZDAmountWei, {
      value: addEtherAmountWei,
    });
  } catch(err){
    console.log(err);
  }
};

export const calculateAZD = async(_addEther = "0", etherBalanceContract, azdTokenReserve)=>{
  const _addEtherAmountWei = utils.parseEther(_addEther);
  const azogDevTokenAmount = _addEtherAmountWei.mul(azdTokenReserve).div(etherBalanceContract);
  return azogDevTokenAmount;
};
