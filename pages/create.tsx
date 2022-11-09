import React, { FormEvent, useState } from 'react'
import Header from '../components/Header'
import {
  useAddress,
  useContract,
  MediaRenderer,
  useNetwork,
  useNetworkMismatch,
  useOwnedNFTs,
  useCreateAuctionListing,
  useCreateDirectListing,
} from '@thirdweb-dev/react'  
import { ChainId, NFT, NATIVE_TOKENS, NATIVE_TOKEN_ADDRESS } from '@thirdweb-dev/sdk'
import network from '../utils/network'
import { useRouter } from 'next/router'
type Props = {}
export default function create({ }: Props) {
  const address = useAddress()
  const { contract } = useContract(process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT, 'marketplace')
  const { contract: collectionContract } = useContract(process.env.NEXT_PUBLIC_COLLECTION_CONTRACT, 'nft-collection')
  const ownedNfts = useOwnedNFTs(collectionContract, address)
  const [selectedNft, setSelectedNft] = useState<NFT>()  
  const networkMismatch = useNetworkMismatch()
  const [, switchNetwork] = useNetwork()
  const router = useRouter()
  const {
    mutate: createDirectListing,
    isLoading: isLoadingDirect,
    error: isErrorDirect
  } = useCreateDirectListing(contract)
  const {
    mutate: createAuctionListing,
    isLoading,
    error
  } = useCreateAuctionListing(contract) 
  const handleCreateListing = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (networkMismatch) {
      switchNetwork && switchNetwork(network)
      return
    }
    if (!selectedNft) return
    const target = e.target as typeof e.target & {
      elements: { listingType: { value: string }, price: { value: string } }
    }
    const { listingType, price } = target.elements
    if (listingType.value === 'directListing') {
      createDirectListing({
        assetContractAddress: process.env.NEXT_PUBLIC_COLLECTION_CONTRACT!,
        tokenId: selectedNft.metadata.id,
        currencyContractAddress: NATIVE_TOKEN_ADDRESS,
        listingDurationInSeconds: 60 * 60 * 24 * 7, // 1 week
        quantity: 1,
        buyoutPricePerToken: price.value,
        startTimestamp: new Date()
      }, {
        onSuccess(data, variables, context) {
          console.log('SUCCESS: ', data, variables, context)
          router.push('/')
        },
        onError(error, variables, context) {
          console.log('ERROR: ', error, variables, context)
        },
      })
    }
    if (listingType.value === 'auctionListing') {
      createAuctionListing({
        assetContractAddress: process.env.NEXT_PUBLIC_COLLECTION_CONTRACT!,
        buyoutPricePerToken: price.value,
        tokenId: selectedNft.metadata.id,
        startTimestamp: new Date(),
        currencyContractAddress: NATIVE_TOKEN_ADDRESS,
        listingDurationInSeconds: 60 * 60 * 24 * 7, // 1 Week
        quantity: 1,
        reservePricePerToken: 0,
      }, {
        onSuccess(data, variables, context) {
          console.log('SUCCESS: ', data, variables, context)
          router.push('/')
        },
        onError(error, variables, context) {
          console.log('ERROR: ', error, variables, context)
        }
      })
    }
  }
  console.log('address is ', address)
  console.log(ownedNfts) 
  console.log(selectedNft)
  return (
    <div>
      <Header />
      <main className='max-w-6xl mx-auto p-10 pt-2'>
        <h1 className='text-4xl font-bold'>List an Item</h1>
        <h2 className='text-xl font-semibold pt-5'>Select an Item you would like to sell</h2>
        <hr className='mb-5' /> 
        <p>Below you will find the NFT's you own in your wallet</p>
        <div className='flex overflow-x-scroll space-x-2 p-4'>
          {ownedNfts?.data?.map(nft => (
            <div className={`flex flex-col space-y-2 card min-w-fit border-2 bg-gray-100 
              ${nft.metadata.id === selectedNft?.metadata.id ? 'border-black' : 'border-transparent'}`}
              key={nft.metadata.id}
              onClick={() => setSelectedNft(nft)}>
              <MediaRenderer className='h-48 rounded-lg' src={nft.metadata.image} />
              <p className='text-lg truncate font-bold'>{nft.metadata.name}</p>
              <p>{nft.metadata.description}</p>
            </div>
          ))}
        </div> 
        {selectedNft && (
          <form onSubmit={handleCreateListing}>
            <div>
              <div className='flex flex-col p-10'>
                <label className='border-r font-light'>Direct Listing / Fixed Price</label>
                <input
                  className='ml-auto h-10 w-10'
                  name='listingType'
                  type='radio'
                  value='directListing'
                />
                <label className='border-r font-light'>Auction</label>
                <input
                  className='ml-auto h-10 w-10'
                  name='ListingType'
                  type='radio'
                  value='auctionListing'
                />
                <label className='border-r font-light'>Price</label>
                <input 
                  className='bg-gray-100 p-5'
                  name='price'
                  type='text'
                  placeholder='0.05'
                />
              </div>
              <button
                className='bg-blue-600 text-white rounded-lf p-4 mt-8'
                type='submit'>Create Listing
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
    
  )
}