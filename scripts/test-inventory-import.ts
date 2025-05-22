/**
 * Test script for the inventory TSV import functionality
 * This script simulates receiving a TSV file and processing it
 */

import fetch from 'node-fetch';
import { storage } from '../server/storage';
import fs from 'fs';
import path from 'path';

// Simple function to prompt for input
function prompt(question: string): Promise<string> {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    readline.question(question, (answer: string) => {
      readline.close();
      resolve(answer);
    });
  });
}

// Helper for API requests
async function apiRequest(endpoint: string, method = 'GET', body?: any) {
  try {
    // Get the API key first
    const dealerships = await storage.getDealerships();
    if (!dealerships || dealerships.length === 0) {
      throw new Error('No dealerships found in the database');
    }

    const dealershipId = dealerships[0].id;
    
    // Get or create an API key for testing
    let apiKeys = await storage.getApiKeysByDealership(dealershipId);
    let apiKey;
    
    if (!apiKeys || apiKeys.length === 0) {
      console.log('No API key found, creating one...');
      const apiKeyData = await storage.generateApiKey(dealershipId, 'Test API Key');
      apiKey = apiKeyData.key;
    } else {
      apiKey = apiKeys[0].key;
    }

    // Make the API request
    const url = `http://localhost:5000${endpoint}`;
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: body ? JSON.stringify(body) : undefined
    });

    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    return { error: error.message };
  }
}

// Create a sample TSV file for testing
function createSampleTsvFile(): string {
  const filePath = path.join(__dirname, 'sample_inventory.tsv');
  
  // Create header row and some sample vehicles
  const content = [
    'VIN\tStockNumber\tMake\tModel\tYear\tTrim\tExteriorColor\tInteriorColor\tMileage\tPrice\tMSRP\tBodyStyle\tTransmission\tEngine\tFuelType\tDrivetrain\tFeatures\tImages',
    '1HGCM82633A123456\tS12345\tHonda\tAccord\t2023\tTouring\tCrystal Black\tBlack Leather\t15\t32000\t34500\tSedan\tAutomatic\t2.0L Turbo\tGasoline\tFWD\tNavigation,Sunroof,Heated Seats\thttps://example.com/car1.jpg,https://example.com/car1b.jpg',
    '5TFCZ5AN0MX123456\tT54321\tToyota\tTacoma\t2022\tTRD Off-Road\tArmy Green\tBlack Cloth\t1200\t39500\t41000\tTruck\tAutomatic\t3.5L V6\tGasoline\t4WD\tTow Package,Off-Road Package,Backup Camera\thttps://example.com/truck1.jpg',
    '1FADP3K21JL123456\tF98765\tFord\tFocus\t2021\tSE\tRuby Red\tGray Cloth\t5500\t19500\t22000\tHatchback\tAutomatic\t1.5L EcoBoost\tGasoline\tFWD\tBluetooth,Backup Camera,Alloy Wheels\t',
    '5YJ3E1EA8MF123456\tT12345\tTesla\tModel 3\t2023\tLong Range\tPearl White\tWhite Vegan Leather\t45\t51000\t51000\tSedan\tAutomatic\tDual Motor\tElectric\tAWD\tAutopilot,Premium Audio,Glass Roof\thttps://example.com/tesla1.jpg,https://example.com/tesla2.jpg'
  ].join('\n');
  
  fs.writeFileSync(filePath, content);
  return filePath;
}

// Test the inventory import API
async function testInventoryImport() {
  console.log('Creating sample TSV file...');
  const filePath = createSampleTsvFile();
  
  try {
    // Get the first dealership for testing
    const dealerships = await storage.getDealerships();
    if (!dealerships || dealerships.length === 0) {
      throw new Error('No dealerships found in the database');
    }
    
    const dealershipId = dealerships[0].id;
    
    console.log(`Using dealership ID: ${dealershipId}`);
    
    // Read the TSV file
    const tsvContent = fs.readFileSync(filePath, 'utf8');
    
    // Send the file to the API
    console.log('Sending inventory data to API...');
    const response = await apiRequest('/api/inventory/import/tsv', 'POST', {
      dealershipId,
      attachmentContent: tsvContent
    });
    
    console.log('API Response:', JSON.stringify(response, null, 2));
    
    // Get inventory stats
    console.log('Getting inventory stats...');
    const statsResponse = await apiRequest('/api/inventory/import/stats', 'GET');
    
    console.log('Inventory Stats:', JSON.stringify(statsResponse, null, 2));
    
    // Get the vehicles to verify import
    console.log('Verifying imported vehicles...');
    const vehicles = await storage.getVehiclesByDealership(dealershipId);
    
    console.log(`Found ${vehicles.length} vehicles in the database`);
    vehicles.forEach((vehicle, index) => {
      console.log(`Vehicle ${index + 1}: ${vehicle.year} ${vehicle.make} ${vehicle.model} (VIN: ${vehicle.vin})`);
    });
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Clean up the sample file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('Sample TSV file deleted');
    }
  }
}

// Run interactive or automated test
async function main() {
  console.log('Inventory Import Test Tool');
  console.log('=========================');
  
  try {
    await testInventoryImport();
  } catch (error) {
    console.error('Error running test:', error);
  }
}

// Run the test
main().catch(console.error);