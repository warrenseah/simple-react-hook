import { useEffect, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import Web3 from 'web3'

// Import ABI
import SimpleStorage from '../abis/SimpleStorage.json'

// Import CSS
import './App.css'

// Import Components
import Navbar from './Navbar'

function App() {
	// SimpleStorage Contract
	const [isGanache, setIsGanache] = useState(false);
	const [simpleStorage, setSimpleStorage] = useState(null);
	const [networkId, setNetworkId] = useState(null);
	const [web3Obj, setWeb3Obj] = useState(null);

	// User & Contract Info
	const [account, setAccount] = useState(null);
	
	const [number, setNumber] = useState(0) // Value of the number in the smart contract
	const [myNumber, setMyNumber] = useState(0) // Value set by the user to change

	// Loading & Error Messages
	const [isLoading, setIsLoading] = useState(true)
	const [message, setMessage] = useState("")

	useEffect(() => {

		// Load and init parameters
		console.log('Establishing connection with MetaMask...')
		loadBlockchainData();

		// Unmount metamask listener
		return () => {
			window.ethereum.removeListener('accountsChanged', handleAccountsChange);
			window.ethereum.removeListener('chainChanged', handleBlockchainChange);
		}
	}, []);

	const loadBlockchainData = async () => {

		try {

			// Await user login
			if (!window.ethereum.isMetaMask) {
				setMessage('Metamask not found, please install Metamask extension.');
				setIsLoading(false);
				return;
			}

			setMessage('Awaiting MetaMask Login...')

			// Load provider
			const web3 = new Web3(window.ethereum);
			setWeb3Obj(web3);

			// Load Account
			const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
			setAccount(accounts[0]);
						
			// Fetch Network ID
			const chainId = await web3.eth.net.getId();
			setNetworkId(chainId);

			// Add change events from metamask
			window.ethereum.on('accountsChanged', handleAccountsChange);

			// Change network event
			window.ethereum.on('chainChanged', handleBlockchainChange);

			// Chain set to ganache local node
			if(chainId === 5777) {
				setIsGanache(true);
			} else {
				setMessage(`Set blockchain network to local ganache. Current Network Id: ${chainId}`);
				setIsLoading(false);
				return;
			}
			

			// Load SimpleStorage contract
			const simpleStorage = new web3.eth.Contract(SimpleStorage.abi, SimpleStorage.networks[chainId].address)
			setSimpleStorage(simpleStorage)

			// Fetch current value
			let result = await simpleStorage.methods.get().call()
			setNumber(result)

			setMessage("")
			setIsLoading(false)

			

		}
		catch (error) {
			console.error(error);
			setMessage('MetaMask not detected, or contract not deployed to current network')
		}

	}

	const handleAccountsChange = (accounts) => {
		setAccount(accounts[0]);
	}

	const handleBlockchainChange = async (chainId) => {
		setIsGanache(null);
		await loadBlockchainData();
	}

	const setNumberHandler = async (e) => {
		e.preventDefault()

		if (myNumber < 0) {
			window.alert('Number cannot be negative')
			return
		}

		if (myNumber === number) {
			window.alert('Number cannot be equal to current value')
			return
		}

		simpleStorage.methods.set(myNumber)
			.send({ from: account })
			.on('transactionHash', () => {
				setNumber(myNumber);
				window.alert('Number Set!')
			});
	}

	const getNumberHandler = async () => {
		let result = await simpleStorage.methods.get().call()
		setNumber(result)
	}
	
	if(!window.ethereum.isMetaMask || !isGanache) {
		return <h1>{message}</h1>
	}


	return (
		<div>

			<Navbar account={account} />

			<main role="main" className="container-fluid text-center">

				{isLoading ? (

					<div>
						<Spinner animation="border" className="mt-4 mb-2" />
						<p>{message}</p>
					</div>

				) : (
					<div className="col-lg-12">

						<div className="row">
							<div className="col">
								<h1 className="my-5">Simple Storage w/ Hooks</h1>
								<h3>NetworkId: {networkId}</h3>
								<p className="number">{number}</p>
							</div>
						</div>

						<div className="row content">
							<div className="col user-controls">

								<button onClick={getNumberHandler}>Get</button>

								<form onSubmit={setNumberHandler}>
									<input type="number" placeholder="Enter a number" onChange={(e) => setMyNumber(e.target.value)} />
									<button type="submit">Set</button>
								</form>

							</div>
						</div>

					</div>
				)}

			</main>

		</div>
	);
}

export default App
