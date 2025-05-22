/**
 * Test script to simulate conversations with Rylie AI
 * This allows testing AI responses to different customer scenarios
 */

import { getRandomTestConversation, createTestConversation, sampleConversations } from './sample-conversations';
import fetch from 'node-fetch';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

// Create readline interface for interactive mode
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// API parameters
const API_URL = 'http://localhost:5000/api';
let API_KEY = ''; // Will be set from environment or user input

// Test modes
enum TestMode {
  INTERACTIVE = 'interactive',
  BATCH = 'batch',
  SPECIFIC = 'specific'
}

// Test configuration
interface TestConfig {
  mode: TestMode;
  apiKey: string;
  scenarioKey?: keyof typeof sampleConversations;
  replyIndex?: number;
  dealershipId?: number;
  saveLogs?: boolean;
  logFileName?: string;
}

// Load API key from environment or .env file
function loadApiKey() {
  try {
    // Try to get API key from environment
    if (process.env.TEST_API_KEY) {
      return process.env.TEST_API_KEY;
    }
    
    // Try to load from .env file
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/TEST_API_KEY=([^\r\n]+)/);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    // Return empty if not found
    return '';
  } catch (error) {
    console.error('Error loading API key:', error);
    return '';
  }
}

// Initialize test configuration
async function initTestConfig(): Promise<TestConfig> {
  // Set default configuration
  const config: TestConfig = {
    mode: TestMode.INTERACTIVE,
    apiKey: loadApiKey(),
    dealershipId: 1,
    saveLogs: true,
    logFileName: `rylie-test-${new Date().toISOString().replace(/:/g, '-')}.log`
  };
  
  // If API key is not set, prompt user for it
  if (!config.apiKey) {
    config.apiKey = await promptUser('Enter your API key: ');
  }
  
  // Prompt for test mode
  const modeInput = await promptUser(
    'Select test mode:\n1. Interactive (simulate conversation turn by turn)\n2. Batch (test all scenarios automatically)\n3. Specific (test a specific scenario)\nEnter choice (1-3): '
  );
  
  switch (modeInput.trim()) {
    case '1':
      config.mode = TestMode.INTERACTIVE;
      break;
    case '2':
      config.mode = TestMode.BATCH;
      break;
    case '3':
      config.mode = TestMode.SPECIFIC;
      // Get specific scenario details
      const scenarioList = Object.keys(sampleConversations).map((key, index) => 
        `${index + 1}. ${key}`
      ).join('\n');
      
      const scenarioChoice = await promptUser(
        `Choose a scenario:\n${scenarioList}\nEnter choice (1-${Object.keys(sampleConversations).length}): `
      );
      
      const scenarioIndex = parseInt(scenarioChoice) - 1;
      if (isNaN(scenarioIndex) || scenarioIndex < 0 || scenarioIndex >= Object.keys(sampleConversations).length) {
        console.log('Invalid selection. Using random scenario.');
      } else {
        config.scenarioKey = Object.keys(sampleConversations)[scenarioIndex] as keyof typeof sampleConversations;
        
        // Get reply index
        const replyChoice = await promptUser(
          `Choose customer reply complexity (1-3):\n1. Standard\n2. Challenging\n3. Difficult\nEnter choice (1-3): `
        );
        
        config.replyIndex = parseInt(replyChoice) - 1;
        if (isNaN(config.replyIndex) || config.replyIndex < 0 || config.replyIndex > 2) {
          config.replyIndex = 0;
        }
      }
      break;
    default:
      console.log('Invalid selection. Using interactive mode.');
      config.mode = TestMode.INTERACTIVE;
  }
  
  return config;
}

// Prompt user for input
function promptUser(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Initialize a conversation on the API
async function initConversation(customerName: string, apiKey: string, dealershipId: number) {
  try {
    const response = await fetch(`${API_URL}/inbound`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        customerName,
        customerPhone: '+1234567890', // Mock phone for testing
        message: 'Hello',
        dealershipId
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Failed to initialize conversation: ${result.message || response.statusText}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error initializing conversation:', error);
    throw error;
  }
}

// Send a message in an existing conversation
async function sendMessage(conversationId: number, message: string, apiKey: string) {
  try {
    const response = await fetch(`${API_URL}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        conversationId,
        message
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Failed to send message: ${result.message || response.statusText}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Get a conversation by ID
async function getConversation(conversationId: number, apiKey: string) {
  try {
    const response = await fetch(`${API_URL}/conversations/${conversationId}`, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey
      }
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Failed to get conversation: ${result.message || response.statusText}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error getting conversation:', error);
    throw error;
  }
}

// Interactive test mode
async function runInteractiveTest(config: TestConfig) {
  console.log('\n=== Interactive Test Mode ===');
  console.log('This mode simulates a conversation step by step.\n');
  
  // Start with random test conversation, or specific if provided
  const { dealershipMessage, customerReply, scenarioName } = config.scenarioKey 
    ? createTestConversation(config.scenarioKey, config.replyIndex)
    : getRandomTestConversation();
  
  console.log(`=== Scenario: ${scenarioName} ===\n`);
  console.log(`Initial Dealership Message: "${dealershipMessage}"`);
  console.log(`First Customer Reply: "${customerReply}"\n`);
  
  // Extract customer name from scenario
  const customerName = customerReply.split(' ')[0] || 'Customer';
  
  // Initialize conversation
  console.log('Initializing conversation...');
  let conversation;
  try {
    conversation = await initConversation(customerName, config.apiKey, config.dealershipId);
    console.log(`Conversation created with ID: ${conversation.id}\n`);
  } catch (error) {
    console.error('Failed to initialize conversation. Exiting.');
    return;
  }
  
  // Start conversation log
  let conversationLog = [
    `=== Scenario: ${scenarioName} ===`,
    `Initial Dealership Message: "${dealershipMessage}"`,
    `First Customer Reply: "${customerReply}"`,
    ''
  ];
  
  // Send first customer message
  console.log('Sending first customer message...');
  let reply;
  try {
    reply = await sendMessage(conversation.id, customerReply, config.apiKey);
    console.log(`\nRylie: "${reply.message}"\n`);
    conversationLog.push(`Rylie: "${reply.message}"`);
  } catch (error) {
    console.error('Failed to send first message. Exiting.');
    return;
  }
  
  // Interactive loop
  let keepGoing = true;
  while (keepGoing) {
    const userInput = await promptUser('Your reply (or type "exit" to end, "scenario" for next message in scenario): ');
    
    if (userInput.toLowerCase() === 'exit') {
      keepGoing = false;
      continue;
    }
    
    let customerMessage = userInput;
    
    // If user wants the next message from the scenario
    if (userInput.toLowerCase() === 'scenario') {
      // Find the next message in the scenario
      const currentReplies = sampleConversations[scenarioName as keyof typeof sampleConversations].customerReplies;
      const nextReplyIndex = (config.replyIndex || 0) + 1;
      
      if (nextReplyIndex < currentReplies.length) {
        customerMessage = currentReplies[nextReplyIndex];
        config.replyIndex = nextReplyIndex;
        console.log(`\nCustomer: "${customerMessage}"`);
      } else {
        console.log('\nNo more messages in this scenario. Please enter your own message or "exit".');
        continue;
      }
    } else {
      console.log(`\nCustomer: "${customerMessage}"`);
    }
    
    conversationLog.push(`Customer: "${customerMessage}"`);
    
    try {
      reply = await sendMessage(conversation.id, customerMessage, config.apiKey);
      console.log(`\nRylie: "${reply.message}"\n`);
      conversationLog.push(`Rylie: "${reply.message}"`);
      
      // Check if handover was triggered
      if (reply.handover) {
        console.log('\n! AI initiated HANDOVER !');
        console.log(`Reason: ${reply.handoverReason || 'Not specified'}`);
        conversationLog.push('');
        conversationLog.push('=== HANDOVER TRIGGERED ===');
        conversationLog.push(`Reason: ${reply.handoverReason || 'Not specified'}`);
        
        const continueAfterHandover = await promptUser('Handover triggered. Continue conversation? (y/n): ');
        if (continueAfterHandover.toLowerCase() !== 'y') {
          keepGoing = false;
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
  
  // Save logs if enabled
  if (config.saveLogs) {
    saveConversationLog(conversationLog.join('\n'), config.logFileName);
    console.log(`Conversation log saved to ${config.logFileName}`);
  }
  
  console.log('\nInteractive test completed.');
}

// Batch test mode
async function runBatchTest(config: TestConfig) {
  console.log('\n=== Batch Test Mode ===');
  console.log('This mode automatically tests Rylie across all scenarios.\n');
  
  const batchLogs: string[] = [`=== Rylie AI Batch Test - ${new Date().toISOString()} ===\n`];
  
  for (const scenarioKey of Object.keys(sampleConversations) as Array<keyof typeof sampleConversations>) {
    console.log(`Testing scenario: ${scenarioKey}`);
    batchLogs.push(`\n=== Scenario: ${scenarioKey} ===\n`);
    
    for (let replyIndex = 0; replyIndex < sampleConversations[scenarioKey].customerReplies.length; replyIndex++) {
      const { dealershipMessage, customerReply } = createTestConversation(scenarioKey, replyIndex);
      
      console.log(`  Testing complexity level ${replyIndex + 1}...`);
      
      batchLogs.push(`--- Complexity Level ${replyIndex + 1} ---`);
      batchLogs.push(`Initial Dealership Message: "${dealershipMessage}"`);
      batchLogs.push(`Customer Reply: "${customerReply}"`);
      
      // Extract customer name from scenario
      const customerName = customerReply.split(' ')[0] || 'Customer';
      
      try {
        // Initialize conversation
        const conversation = await initConversation(customerName, config.apiKey, config.dealershipId);
        
        // Send customer message
        const reply = await sendMessage(conversation.id, customerReply, config.apiKey);
        
        batchLogs.push(`Rylie: "${reply.message}"`);
        
        // Check if handover was triggered
        if (reply.handover) {
          batchLogs.push(`[HANDOVER TRIGGERED] Reason: ${reply.handoverReason || 'Not specified'}`);
        }
        
        batchLogs.push('');
      } catch (error) {
        console.error(`Error testing ${scenarioKey} level ${replyIndex + 1}:`, error);
        batchLogs.push(`[ERROR] ${error.message}`);
        batchLogs.push('');
      }
    }
  }
  
  // Save logs
  if (config.saveLogs) {
    const batchLogFileName = `rylie-batch-test-${new Date().toISOString().replace(/:/g, '-')}.log`;
    saveConversationLog(batchLogs.join('\n'), batchLogFileName);
    console.log(`\nBatch test log saved to ${batchLogFileName}`);
  }
  
  console.log('\nBatch test completed.');
}

// Specific test mode
async function runSpecificTest(config: TestConfig) {
  if (!config.scenarioKey) {
    console.log('No scenario specified. Exiting.');
    return;
  }
  
  console.log(`\n=== Testing Specific Scenario: ${config.scenarioKey} ===`);
  const { dealershipMessage, customerReply } = createTestConversation(
    config.scenarioKey, 
    config.replyIndex || 0
  );
  
  console.log(`Initial Dealership Message: "${dealershipMessage}"`);
  console.log(`Customer Reply: "${customerReply}"\n`);
  
  // Extract customer name from scenario
  const customerName = customerReply.split(' ')[0] || 'Customer';
  
  const specificLogs = [
    `=== Scenario: ${config.scenarioKey} ===`,
    `Complexity Level: ${(config.replyIndex || 0) + 1}`,
    `Initial Dealership Message: "${dealershipMessage}"`,
    `Customer Reply: "${customerReply}"`,
    ''
  ];
  
  try {
    // Initialize conversation
    console.log('Initializing conversation...');
    const conversation = await initConversation(customerName, config.apiKey, config.dealershipId);
    console.log(`Conversation created with ID: ${conversation.id}\n`);
    
    // Send customer message
    console.log('Sending customer message...');
    const reply = await sendMessage(conversation.id, customerReply, config.apiKey);
    console.log(`\nRylie: "${reply.message}"\n`);
    
    specificLogs.push(`Rylie: "${reply.message}"`);
    
    // Check if handover was triggered
    if (reply.handover) {
      console.log('! AI initiated HANDOVER !');
      console.log(`Reason: ${reply.handoverReason || 'Not specified'}`);
      
      specificLogs.push('');
      specificLogs.push('=== HANDOVER TRIGGERED ===');
      specificLogs.push(`Reason: ${reply.handoverReason || 'Not specified'}`);
    }
    
    // Interactive follow-up
    const continueInteractive = await promptUser('\nContinue in interactive mode? (y/n): ');
    if (continueInteractive.toLowerCase() === 'y') {
      // Switch to interactive mode
      config.mode = TestMode.INTERACTIVE;
      await runInteractiveTest(config);
      return;
    }
    
  } catch (error) {
    console.error('Error during specific test:', error);
    specificLogs.push(`[ERROR] ${error.message}`);
  }
  
  // Save logs
  if (config.saveLogs) {
    const specificLogFileName = `rylie-specific-test-${config.scenarioKey}-${new Date().toISOString().replace(/:/g, '-')}.log`;
    saveConversationLog(specificLogs.join('\n'), specificLogFileName);
    console.log(`\nSpecific test log saved to ${specificLogFileName}`);
  }
  
  console.log('\nSpecific test completed.');
}

// Save conversation log to file
function saveConversationLog(logContent: string, fileName?: string) {
  try {
    const logsDir = path.join(process.cwd(), 'test-data', 'logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const logPath = path.join(logsDir, fileName || `rylie-test-${Date.now()}.log`);
    fs.writeFileSync(logPath, logContent);
    
    return logPath;
  } catch (error) {
    console.error('Error saving conversation log:', error);
    return null;
  }
}

// Main function
async function main() {
  console.log('\n=== Rylie AI Conversation Test Tool ===\n');
  
  try {
    // Initialize test configuration
    const config = await initTestConfig();
    
    // Run test based on mode
    switch (config.mode) {
      case TestMode.INTERACTIVE:
        await runInteractiveTest(config);
        break;
      case TestMode.BATCH:
        await runBatchTest(config);
        break;
      case TestMode.SPECIFIC:
        await runSpecificTest(config);
        break;
    }
  } catch (error) {
    console.error('Error running test:', error);
  } finally {
    // Close readline interface
    rl.close();
  }
}

// Run the test script if executed directly
if (require.main === module) {
  main();
}

export {
  runInteractiveTest,
  runBatchTest,
  runSpecificTest,
  TestMode,
  TestConfig
};