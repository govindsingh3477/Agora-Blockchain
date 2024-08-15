"use client";
import React, { useEffect } from "react";
import { Election } from "../../../abi/artifacts/Election";
import { useAccount, useReadContracts } from "wagmi";
import Loader from "../../components/Helper/Loader";
import ElectionDetails from "../../components/Cards/ElectionDetails";
import ClipBoard from "../../components/Helper/ClipBoard";
import ElectionCandidates from "../../components/Cards/ElectionCandidates";
import { Toaster } from "react-hot-toast";
import ButtonCard from "../../components/Cards/ButtonCard";
import { sepolia, avalancheFuji } from "viem/chains";
import { useElectionData } from "@/app/hooks/ElectionInfo";
import { fetchAllGroups } from "@/app/helpers/fetchFileFromIPFS";
import { useHashIPFS } from "@/app/hooks/HashIPFS";
import CrossChain from "@/app/components/Helper/CrossChain";
import { CCIPSender } from "@/abi/artifacts/CCIPSender";
import { CCIP_FUJI_ADDRESS } from "@/app/constants";

const page = ({ params }: { params: { id: `0x${string}` } }) => {
  const { hashIPFS, sethashIPFS } = useHashIPFS();
  const { address } = useAccount();
  const electionAddress = params.id;
  const { electionData, setelectionData } = useElectionData();
  const electionContract = {
    abi: Election,
    address: electionAddress,
    chainId: sepolia.id,
  };
  const CCIPContract = {
    abi: CCIPSender,
    address: CCIP_FUJI_ADDRESS as `0x${string}`,
    chainId: avalancheFuji.id,
  };
  const { data: electionInformation, isLoading } = useReadContracts({
    contracts: [
      {
        ...electionContract,
        functionName: "owner",
      },
      {
        ...electionContract,
        functionName: "getWinners",
      },
      {
        ...electionContract,
        functionName: "electionInfo",
      },
      {
        ...electionContract,
        functionName: "resultType",
      },
      {
        ...electionContract,
        functionName: "totalVotes",
      },
      {
        ...electionContract,
        functionName: "userVoted",
        args: [address!],
      },
      {
        ...electionContract,
        functionName: "resultsDeclared",
      },
      {
        ...electionContract,
        functionName: "getCandidateList",
      },
      {
        ...electionContract,
        functionName: "electionId",
      },
      {
        ...CCIPContract,
        functionName: "electionApproved",
        args: [electionAddress],
      },
    ],
  });

  const getgroups = async () => {
    const response = await fetchAllGroups();
    sethashIPFS(response);
  };
  useEffect(() => {
    !hashIPFS && getgroups();
  }, []);

  if (isLoading) return <Loader />;

  if (electionData !== electionInformation) {
    setelectionData(electionInformation);
  }

  if (!electionData || hashIPFS == null) return <Loader />;
  const owner = electionData[0].result;
  const winners = Number(electionData[1].result);
  const electionInfo = electionData[2].result;
  const resultType = electionData[3].result;
  const totalVotes = Number(electionData[4].result);
  const userVoted = electionData[5].result;
  const resultDeclared = electionData[6].result;
  const candidateList = electionData[7].result;
  const electionID = electionData[8].result;
  const isCrossChainEnabled = electionData[9].result;
  console.log("isCrossChainEnabled : ", isCrossChainEnabled);
  const isStarting = Math.floor(Date.now() / 1000) < Number(electionInfo[0]);
  const isEnded = Math.floor(Date.now() / 1000) > Number(electionInfo[1]);
  const electionStat = isStarting ? 1 : isEnded ? 3 : 2;
  return (
    <div className="min-h-screen overflow-auto bg-white pt-20 w-full flex items-start justify-center">
      <div className="my-2 rounded-2xl">
        <div className="">
          <div className=" p-2 rounded-lg md:p-4 ">
            <div className="flex mx-6 my-1 w-full items-start justify-around lg:mx-0">
              <div className="flex flex-col">
                <p className="mt-2 text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
                  {electionInfo![2]}
                </p>
                <div className="mt-2 text-sm sm:text-lg leading-8 text-gray-600">
                  {electionInfo![3]}
                </div>
              </div>
            </div>
          </div>
          <ElectionDetails electionStat={electionStat} />
          <div className="md:flex-row gap-x-4 flex flex-col items-center sm:items-stretch justify-between">
            <ElectionCandidates
              isOwner={owner === address}
              resultType={resultType}
              electionStat={electionStat}
            />
            <ButtonCard isOwner={owner === address} />
          </div>
          <div className="md:flex-row gap-x-4 flex flex-col items-center sm:items-stretch justify-between">
            <ClipBoard inputValue={window.location.href} />
            <CrossChain
              isEnded={isEnded}
              electionAddress={electionAddress}
              isCrossChainEnabled={isCrossChainEnabled}
            />
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
};

export default page;
