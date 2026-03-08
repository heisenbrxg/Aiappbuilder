// Test script to verify Web3 deployment API
const testContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HelloDigimetrix {
    string public message;
    address public owner;
    
    constructor() {
        message = "Hello from Starsky!";
        owner = msg.sender;
    }
    
    function setMessage(string memory _message) public {
        require(msg.sender == owner, "Only owner can set message");
        message = _message;
    }
    
    function getMessage() public view returns (string memory) {
        return message;
    }
}`;

async function testDeployment() {
    console.log('🧪 Testing Web3 deployment API...');
    
    try {
        const response = await fetch('http://localhost:5173/api/deploy/web3', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contractName: 'HelloDigimetrix',
                sourceCode: testContract,
                network: 'sepolia',
                constructorArgs: []
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('📡 Streaming deployment logs...\n');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        
                        switch (data.type) {
                            case 'log':
                                process.stdout.write(data.data.replace(/\\n/g, '\n'));
                                break;
                            case 'success':
                                console.log('\n🎉 SUCCESS!');
                                console.log(`📍 Contract Address: ${data.address}`);
                                console.log(`🔗 Transaction Hash: ${data.txHash}`);
                                console.log(`🌐 Explorer: ${data.explorerUrl}`);
                                return;
                            case 'error':
                                console.log('\n❌ ERROR:', data.message);
                                return;
                        }
                    } catch (e) {
                        console.error('Failed to parse SSE data:', e);
                    }
                }
            }
        }
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Check if environment variables are set
console.log('🔍 Checking environment variables...');
if (!process.env.PRIVATE_KEY_SEPOLIA) {
    console.log('⚠️  PRIVATE_KEY_SEPOLIA not set in environment');
}
if (!process.env.ALCHEMY_API_KEY_SEPOLIA) {
    console.log('⚠️  ALCHEMY_API_KEY_SEPOLIA not set in environment');
}

testDeployment();
