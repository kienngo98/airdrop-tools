import { useBalance, useNetwork } from "@thirdweb-dev/react";
import { NATIVE_TOKEN_ADDRESS } from "@thirdweb-dev/sdk";
import { isAddress } from "ethers/lib/utils";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import useFetchErc20Tokens from "../../hooks/useFetchErc20Tokens";
import { TEvmAddress } from "../../types";
import { TErc20 } from "../../types/glacier-api";
import { copyTextToClipboard } from "../../utils/misc";
import { convertBigNumToFloat } from "../../utils/number";
import { truncateEthAddress } from "../../utils/string";
import ArrowDownIcon from "../icons/ArrowDownIcon";
import GreenCheckMark from "../icons/GreenCheckmark";
import Erc20RecipientsWrapper from "../token/Erc20RecipientsWrapper";

const AddTokenRecipients = dynamic(
  () => import("../token/AddTokenRecipients"),
  { ssr: false }
);

export default function TokenTab() {
  const { data: balanceData, isLoading } = useBalance(NATIVE_TOKEN_ADDRESS);
  const [{ data: chainData, error, loading: loadingNetwork }] = useNetwork();
  const [showLowBalances, setShowLowBalances] = useState<boolean>(false);
  const [lowBalanceThreshhold, setLowBalanceThreshold] = useState<number>(0.5);
  const [selectedTokenAddress, setSelectedTokenAddress] =
    useState<TEvmAddress>();
  const {
    erc20Tokens,
    errorMsg,
    isLoading: loadingErc20Tokens,
    fetchErc20Tokens,
  } = useFetchErc20Tokens();
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const displayItems: TErc20[] = showLowBalances
    ? erc20Tokens
    : erc20Tokens.filter(
        (item) =>
          convertBigNumToFloat(item.balance, item.decimals) >
          lowBalanceThreshhold
      );
  const copyTokenAddress = async (address: TEvmAddress) => {
    await copyTextToClipboard(address as string);
    alert("Copied");
  };
  const importContract = () => {
    if (!inputRef.current) return;
    const value = inputRef.current.value;
    if (!value) return alert("Please select a token");
    if (!isAddress(value)) return alert("Invalid token address");
    setSelectedTokenAddress(value as TEvmAddress);
  };
  const clearInput = () => {
    if (inputRef.current) inputRef.current.value = "";
    if (selectRef.current) selectRef.current.value = "Select a token";
    setSelectedTokenAddress(undefined);
  };
  return (
    <div className="flex flex-col mx-auto mt-10">
      <div className="text-2xl pl-2">Your tokens</div>
      <div className="pl-2">
        <div>
          {chainData.chain?.nativeCurrency?.symbol} balance:{" "}
          {balanceData?.displayValue}
        </div>
      </div>
      <details className="mt-4">
        <summary className="bg-primary w-[95vw] lg:w-[800px] md:w-[700px] py-2 pl-2 rounded-lg cursor-pointer">
          ERC Tokens ({displayItems.length})
        </summary>
        <div className="flex flex-col px-2">
          <div className="flex flex-col border border-gray-400 p-2 mt-2">
            <div className="flex flex-row">
              <div>
                <button
                  className="border border-white px-2"
                  onClick={() => fetchErc20Tokens}
                >
                  Refresh
                </button>
              </div>
              <div className="ml-auto">
                <label htmlFor="toggleShowBalanceInput">
                  Show low balances:
                </label>{" "}
                <input
                  id="toggleShowBalanceInput"
                  type="checkbox"
                  onChange={() => setShowLowBalances(!showLowBalances)}
                />
              </div>
            </div>
            {displayItems.map((item: TErc20, index) => (
              <div
                className={`flex flex-col  border-gray-400 py-3 ${
                  index === displayItems.length - 1 ? "" : "border-b"
                }`}
                key={item.address}
              >
                <div>
                  <span className="text-success font-bold">{item.symbol}</span>{" "}
                  - {item.name}
                </div>
                <div>
                  Balance: {convertBigNumToFloat(item.balance, item.decimals)}
                </div>
                <div className="flex flex-row">
                  <div className="my-auto">
                    Contract:{" "}
                    <a
                      className="underline"
                      href={`https://${item.address}-to-be-worked-on`}
                      target="_blank"
                    >
                      {truncateEthAddress(item.address)}
                    </a>
                  </div>
                  <button
                    className="underline font-bold my-auto ml-6"
                    onClick={() => copyTokenAddress(item.address)}
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </details>
      <details className="mt-4">
        <summary className="bg-primary w-[95vw] lg:w-[800px] md:w-[700px] py-2 pl-2 rounded-lg cursor-pointer">
          Transfer tokens
        </summary>
        <div className="flex flex-col px-1 w-[95vw] lg:w-[800px] md:w-[700px]">
          <div className="flex flex-col border border-gray-400 p-2 mt-2">
            <div className="font-bold text-lg">
              Step 1: Select the token to send
            </div>
            <div className="text-xs lg:w-[750px] md:w-[650px] w-[85vw]">
              If the token you&apos;re looking for is not in the list, it might
              be because the API did not index that token. In that case,
              manually paste the token address in the box
            </div>

            <select
              disabled={selectedTokenAddress !== undefined}
              ref={selectRef}
              className="border border-white px-2 py-1 mx-auto mt-4 disabled:cursor-not-allowed"
              placeholder="Select a token"
              onChange={(e) => {
                const _addrr = e.target.value;
                if (inputRef.current) inputRef.current.value = _addrr;
              }}
            >
              <option value="Select a token">Select a token</option>
              <option
                value={NATIVE_TOKEN_ADDRESS}
                className="bg-warning text-black"
              >
                ${chainData.chain?.nativeCurrency?.symbol} (Native token)
              </option>
              {erc20Tokens.map((item) => (
                <option
                  value={item.address}
                  key={item.address}
                  className="py-1"
                >
                  ${item.symbol} -- {item.name}
                </option>
              ))}
            </select>
            <div className="mx-auto mt-3">
              <ArrowDownIcon />
            </div>
            <div className="mx-auto mt-4 flex flex-col">
              <input
                disabled={selectedTokenAddress !== undefined}
                ref={inputRef}
                className="enabled:border enabled:border-white px-2 py-2 lg:w-[500px] md:w-[500px] text-center min-w-[300px] max-w-[350px] text-sm disabled:cursor-not-allowed"
                type="text"
                placeholder="Contract to send"
              />
              {!selectedTokenAddress && (
                <>
                  <button
                    onClick={clearInput}
                    className="mx-auto mt-2 underline disabled:cursor-not-allowed"
                    disabled={selectedTokenAddress !== undefined}
                  >
                    Clear
                  </button>
                  <button
                    onClick={importContract}
                    disabled={selectedTokenAddress !== undefined}
                    className="mt-6 rounded-lg border border-green-500 w-fit px-5 mx-auto enabled:hover:text-black enabled:hover:bg-green-500 duration-200 disabled:cursor-not-allowed disabled:text-gray-400 disabled:border-gray-400"
                  >
                    Next
                  </button>
                </>
              )}
            </div>
            {selectedTokenAddress && (
              <div className="ml-auto">
                <GreenCheckMark />
              </div>
            )}
          </div>
          {/* Step 2 */}
          {selectedTokenAddress && (
            <>
              {selectedTokenAddress === NATIVE_TOKEN_ADDRESS ? (
                <>
                  {balanceData && (
                    <AddTokenRecipients
                      cancelFn={setSelectedTokenAddress}
                      tokenAddress={selectedTokenAddress}
                      balanceData={balanceData}
                    />
                  )}
                </>
              ) : (
                <Erc20RecipientsWrapper
                  tokenAddress={selectedTokenAddress}
                  cancelFn={setSelectedTokenAddress}
                />
              )}
            </>
          )}
        </div>
      </details>
    </div>
  );
}
