import { useAddress } from "@thirdweb-dev/react";
import { NATIVE_TOKEN_ADDRESS } from "@thirdweb-dev/sdk";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { TErc20BalanceData, TEvmAddress, TValidateError } from "../../types";
import { validateInputAddress } from "../../utils/misc";
import GreenCheckMark from "../icons/GreenCheckmark";
import ExportDataBtn from "../shared/ExportDataBtn";
import UploadTokenRecipients from "./UploadTokenRecipients";

const ConfirmTokenTransfer = dynamic(() => import("./ConfirmTokenTransfer"), {
  ssr: false,
});

type Props = {
  balanceData: TErc20BalanceData;
  tokenAddress: TEvmAddress;
  cancelFn: Function;
};
export type TRecipient = {
  to: string;
  amount: number;
};

export default function AddTokenRecipients(props: Props) {
  const { balanceData, tokenAddress, cancelFn } = props;
  const address = useAddress();
  const [canSubmit, setCanSubmit] = useState<boolean>(false);
  const [showNextStep, setShowNextStep] = useState<boolean>(false);
  const [recipients, setRecipients] = useState<TRecipient[]>([
    { to: "", amount: 0 },
  ]);
  const excludedContractAddresses = [NATIVE_TOKEN_ADDRESS, tokenAddress];
  const totalAmountToSend: number = recipients.length
    ? recipients
        .map((item) => (item.amount < 0 ? 0 : item.amount))
        .reduce((accumulator, currentValue) => {
          return accumulator + currentValue;
        })
    : 0;
  const availableBalance = balanceData?.displayValue
    ? parseFloat(balanceData.displayValue) - totalAmountToSend
    : 0;
  const updateTokenAmount = (index: number, amount: number) => {
    recipients[index].amount = amount ? amount : 0;
    setRecipients([...recipients]);
  };
  const updateRecipientAddress = (index: number, address: string) => {
    recipients[index].to = address;
    setRecipients([...recipients]);
  };
  const amountToSendToLarge = totalAmountToSend >= availableBalance;
  const addMoreRecipients = () => {
    recipients.push({ to: "", amount: 0 });
    setRecipients([...recipients]);
  };
  const deleteRecipient = (index: number) => {
    recipients.splice(index, 1);
    setRecipients([...recipients]);
  };

  const validateTokenAmount = (value: number): TValidateError => {
    if (value <= 0) return { valid: false, message: "Amount must be > 0" };
    if (value > availableBalance)
      return { valid: false, message: "Amount exceeds available balance" };
    return { valid: true };
  };
  const submitRecipients = () => {
    setShowNextStep(true);
  };
  useEffect(() => {
    if (recipients.length === 0) {
      setCanSubmit(false);
    }
    if (
      recipients.some(
        (item) =>
          !validateInputAddress(item.to, excludedContractAddresses, address)
            .valid || !validateTokenAmount(item.amount).valid
      )
    ) {
      setCanSubmit(false);
      return;
    }
    setCanSubmit(true);
  }, [recipients]);
  if (!balanceData) return <div>Oops, something went wrong..</div>;
  return (
    <>
      <div className="flex flex-col border border-gray-400 p-2 mt-2">
        <div className="font-bold text-lg">Step 2: Add recipients</div>
        <div className="flex flex-col">
          <div className="mt-2">
            You are sending ${balanceData.symbol} - {balanceData.name}
            <br />
            Available balance:{" "}
            <span
              className={`font-bold ${
                availableBalance < 0 ? "text-red-500" : ""
              }`}
            >
              {availableBalance}
            </span>
          </div>
          <UploadTokenRecipients disabled={showNextStep} onCompleted={setRecipients} />
          {amountToSendToLarge && (
            <div className="text-red-500 text-xm text-center">
              Warning: Amount to send exceeded available balance.
            </div>
          )}
          <div className="flex flex-col mt-2">
            {recipients.map((item, index) => {
              const addressErrorMsg = validateInputAddress(
                item.to,
                excludedContractAddresses,
                address
              ).message;
              const amountErrorMsg = validateTokenAmount(item.amount).message;
              return (
                <div className="flex flex-row justify-center mt-2" key={index}>
                  <div className="flex flex-col lg:min-w-[300px] md:min-w-[300px] flex-grow-[1] lg:flex-grow-0 md:flex-grow-0">
                    {index === 0 && <div>Address</div>}
                    <input
                      disabled={showNextStep}
                      defaultValue={item.to}
                      type="text"
                      placeholder="Wallet address"
                      className={`disabled:cursor-not-allowed w-full pl-1 py-1 max-w-[350px] text-xs h-[32px] ${
                        addressErrorMsg ? "border border-red-500" : ""
                      }`}
                      onChange={(e) =>
                        updateRecipientAddress(index, e.target.value)
                      }
                    />
                    {(addressErrorMsg || amountErrorMsg) && (
                      <div className="text-red-500">
                        {addressErrorMsg ? addressErrorMsg : amountErrorMsg}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    {index === 0 && <div>&nbsp;Amount</div>}
                    <input
                      disabled={showNextStep}
                      defaultValue={item.amount}
                      type="number"
                      placeholder="Amount"
                      className={`disabled:cursor-not-allowed max-w-[100px] ml-1 pl-1 py-1 text-center h-[32px] ${
                        amountErrorMsg ? "border border-red-500" : ""
                      }`}
                      onChange={(e) =>
                        updateTokenAmount(index, parseFloat(e.target.value))
                      }
                    />
                    {!showNextStep && (
                      <button
                        disabled={showNextStep}
                        onClick={() => deleteRecipient(index)}
                        className="enabled:hover:underline enabled:hover:text-red-500 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {!showNextStep ? (
              <>
                <button
                  disabled={showNextStep}
                  onClick={addMoreRecipients}
                  className="mt-4 rounded-lg border border-white w-fit px-5 mx-auto enabled:hover:text-black enabled:hover:bg-white duration-200 disabled:cursor-not-allowed disabled:text-gray-400"
                >
                  Add more +
                </button>
                <div className="mx-auto mt-6">
                  <button
                    disabled={!canSubmit}
                    onClick={submitRecipients}
                    className="rounded-lg border border-success w-fit px-5 enabled:hover:text-black enabled:hover:bg-success duration-200 disabled:cursor-not-allowed disabled:text-gray-400 disabled:border-gray-400"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => cancelFn(undefined)}
                    className="ml-2 border border-red-500 px-4 rounded-md hover:text-white hover:bg-red-500 duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="mx-auto mt-4">
                <ExportDataBtn data={recipients} />
              </div>
            )}
          </div>
        </div>
        {showNextStep && (
          <div className="ml-auto">
            <GreenCheckMark />
          </div>
        )}
      </div>

      {/* Next step */}
      {showNextStep && (
        <ConfirmTokenTransfer
          tokenAddress={tokenAddress}
          totalAmountToSend={totalAmountToSend}
          balanceData={balanceData}
          recipients={recipients}
          cancelFn={setShowNextStep}
        />
      )}
    </>
  );
}
