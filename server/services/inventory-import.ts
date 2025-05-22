import { storage } from '../storage';
import { type InsertVehicle } from '@shared/schema';
import fs from 'fs';
import path from 'path';

export async function processTsvInventory(
  filePath: string,
  dealershipId: number
): Promise<{ success: boolean; stats: { added: number; updated: number; errors: number } }> {
  const stats = { added: 0, updated: 0, errors: 0 };

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');
    const headers = lines[0].split('\t').map(header => header.trim());

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = line.split('\t');
        const vehicleData: Record<string, string> = {};

        headers.forEach((header, index) => {
          if (index < values.length) {
            vehicleData[header] = values[index];
          }
        });

        const vehicle = mapDealershipTsvToVehicle(vehicleData, dealershipId);

        const existingVehicle = await storage.getVehicleByVin(vehicle.vin);

        if (existingVehicle) {
          await storage.updateVehicle(existingVehicle.id, vehicle);
          stats.updated++;
        } else {
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

function mapDealershipTsvToVehicle(data: Record<string, string>, dealershipId: number): InsertVehicle {
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
    price: parseFloat(data.Price?.replace(/[$,]/g, '') || '0'),
    msrp: parseFloat(data['Formatted Price']?.replace(/[$,]/g, '') || '0'),
    bodyStyle: data.Type || '',
    transmission: data.Transmission || '',
    engine: '',
    fuelType: data['Fuel Type'] || '',
    drivetrain: data.Drivetrain || '',
    features: [],
    description: data.Description || data.Title || '',
    images: data['Image URL'] ? [data['Image URL']] : [],
    status: data.Condition?.toLowerCase() === 'new' ? 'new' : 'used',
    isActive: true,
    url: data.URL || '',
    doors: data.Doors ? parseInt(data.Doors, 10) : null,
    advertiserName: data['Advertiser Name'] || '',
    imageType: data['Image Type'] || '',
    vehicleType: data['Vehicle Type'] || '',
    condition: data.Condition || ''
  };
}

export async function processInventoryEmail(
  attachmentContent: string,
  dealershipId: number,
  tempFilePath?: string
): Promise<{ success: boolean; stats: { added: number; updated: number; errors: number } }> {
  const filePath = tempFilePath || path.join(process.cwd(), `temp_inventory_${Date.now()}.tsv`);

  try {
    fs.writeFileSync(filePath, attachmentContent);
    const result = await processTsvInventory(filePath, dealershipId);

    if (!tempFilePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return result;
  } catch (error) {
    console.error('Error processing inventory email:', error);
    if (!tempFilePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return {
      success: false,
      stats: { added: 0, updated: 0, errors: 0 }
    };
  }
}