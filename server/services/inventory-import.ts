import { storage } from '../storage';
import { type InsertVehicle } from '@shared/schema';
import fs from 'fs';
import path from 'path';

/**
 * Process a TSV file containing vehicle inventory data
 * 
 * @param filePath Path to the TSV file
 * @param dealershipId ID of the dealership this inventory belongs to
 * @returns Object containing success status and stats
 */
export async function processTsvInventory(
  filePath: string,
  dealershipId: number
): Promise<{ success: boolean; stats: { added: number; updated: number; errors: number } }> {
  const stats = { added: 0, updated: 0, errors: 0 };
  
  try {
    // Read the TSV file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');
    
    // Extract headers from the first line
    const headers = lines[0].split('\t').map(header => header.trim());
    
    // Process each line of the file (skip the header row)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      try {
        const values = line.split('\t');
        const vehicleData: Record<string, string> = {};
        
        // Map values to their headers
        headers.forEach((header, index) => {
          if (index < values.length) {
            vehicleData[header] = values[index];
          }
        });
        
        // Convert to vehicle record using a consistent mapping approach
        const vehicle = mapTsvToVehicle(vehicleData, dealershipId);
        
        // Check if vehicle already exists
        const existingVehicle = await storage.getVehicleByVin(vehicle.vin);
        
        if (existingVehicle) {
          // Update existing vehicle
          await storage.updateVehicle(existingVehicle.id, vehicle);
          stats.updated++;
        } else {
          // Add new vehicle
          await storage.createVehicle(vehicle);
          stats.added++;
        }
      } catch (error) {
        console.error(`Error processing line ${i}:`, error);
        stats.errors++;
      }
    }
    
    return { success: true, stats };
  } catch (error) {
    console.error('Error processing TSV file:', error);
    return { success: false, stats };
  }
}

/**
 * Map TSV data to the vehicle schema structure
 * 
 * @param data Record containing TSV columns
 * @param dealershipId ID of the dealership
 * @returns Structured vehicle data
 */
function mapTsvToVehicle(data: Record<string, string>, dealershipId: number): InsertVehicle {
  // Updated mapping based on the actual dealership TSV format
  
  // Handle images - check if Image URL exists and use it
  const imageUrls: string[] = [];
  if (data['Image URL'] && data['Image URL'].trim()) {
    imageUrls.push(data['Image URL'].trim());
  }
  
  // Features aren't directly in the TSV, but we can set up an empty array
  // or extract from the description if useful
  const featuresList: string[] = [];

  return {
    dealershipId,
    vin: data.VIN || '',
    stockNumber: data.stock_number || '',
    make: data.Make || '',
    model: data.Model || '',
    year: parseInt(data.Year || '0', 10),
    trim: data.Trim || '',
    exteriorColor: data.Color || '',
    interiorColor: '',
    mileage: parseInt(data.Mileage || '0', 10),
    price: parseFloat(data.Price || data['Formatted Price']?.replace(/[$,]/g, '') || '0'),
    msrp: parseFloat(data['Formatted Price']?.replace(/[$,]/g, '') || data.Price || '0'),
    bodyStyle: data.Type || data['Vehicle Type'] || '',
    transmission: data.Transmission || '',
    engine: '',
    fuelType: data['Fuel Type'] || '',
    drivetrain: data.Drivetrain || '',
    features: featuresList,
    description: data.Description || data.Title || '',
    images: imageUrls,
    status: data.Condition?.toLowerCase() === 'new' ? 'new' : 'used',
    isActive: true,
    url: data.URL || '',
    doors: data.Doors ? parseInt(data.Doors, 10) : null,
    advertiserName: data['Advertiser Name'] || '',
    imageType: data['Image Type'] || '',
    vehicleType: data['Vehicle Type'] || '',
    condition: data.Condition || '',
  };
}

/**
 * Process inventory email with TSV attachment
 * 
 * @param attachmentContent The TSV file content as string
 * @param dealershipId ID of the dealership this inventory belongs to
 * @param tempFilePath Optional temp file path to use
 * @returns Processing result stats
 */
export async function processInventoryEmail(
  attachmentContent: string,
  dealershipId: number,
  tempFilePath?: string
): Promise<{ success: boolean; stats: { added: number; updated: number; errors: number } }> {
  // Create a temp file to store the TSV content
  const filePath = tempFilePath || path.join(process.cwd(), `temp_inventory_${Date.now()}.tsv`);
  
  try {
    // Write attachment content to temp file
    fs.writeFileSync(filePath, attachmentContent);
    
    // Process the TSV file
    const result = await processTsvInventory(filePath, dealershipId);
    
    // Clean up the temp file unless a path was provided
    if (!tempFilePath) {
      fs.unlinkSync(filePath);
    }
    
    return result;
  } catch (error) {
    console.error('Error processing inventory email:', error);
    
    // Clean up the temp file if we created it
    if (!tempFilePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return {
      success: false,
      stats: { added: 0, updated: 0, errors: 0 }
    };
  }
}