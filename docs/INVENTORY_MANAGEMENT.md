# Inventory Management and Email Import System

This guide explains how to manage vehicle inventory in the Rylie AI platform, with a focus on the automated email import system.

## Table of Contents
1. [Overview](#overview)
2. [Inventory Dashboard](#inventory-dashboard)
3. [Import Methods](#import-methods)
4. [Email Import System](#email-import-system)
5. [TSV File Format](#tsv-file-format)
6. [Manual Inventory Management](#manual-inventory-management)
7. [Vehicle Data Structure](#vehicle-data-structure)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Overview

Rylie AI maintains an up-to-date inventory of your dealership's vehicles to provide accurate information during customer conversations. The system supports multiple methods for keeping inventory current, with the email import system being the most convenient for dealerships that already have an inventory management system in place.

Key features:
- Automated daily imports via email attachments
- Support for standard TSV (Tab-Separated Values) format
- Manual inventory management through the dashboard
- Direct API integration for real-time updates
- Intelligent vehicle matching during conversations

## Inventory Dashboard

The Inventory Dashboard is accessible from the main navigation menu and provides:
- A complete view of your current inventory
- Search and filtering capabilities
- Import history and status
- Manual entry and editing tools
- Inventory statistics and insights

![Inventory Dashboard](https://assets.rylie-ai.com/docs/inventory-dashboard.png)

## Import Methods

Rylie AI supports multiple methods for importing and updating inventory:

1. **Email Import**: Set up automated emails with TSV attachments (most common)
2. **Manual Upload**: Upload TSV files through the dashboard
3. **Manual Entry**: Add or edit vehicles directly in the dashboard
4. **API Integration**: Use the API to sync inventory in real-time

## Email Import System

The email import system allows for automated, daily updates to your inventory through emailed TSV attachments.

### Setup Process

1. **Configure Email Source**:
   - Go to Settings > Inventory Management
   - Set up an authorized email sender (e.g., inventory@yourdealership.com)
   - This email will be allowed to send inventory updates

2. **Configure Import Schedule**:
   - Set preferred import frequency (daily recommended)
   - Choose processing time (typically overnight)
   - Set notification preferences for import results

3. **Send Test Import**:
   - Prepare a TSV file with your inventory data
   - Send an email with the TSV file attached to: `inventory@rylie-ai.com`
   - Include your dealership ID in the subject line: "Inventory Update - ID: 12345"
   - Check the import results in the dashboard

### How It Works

1. Your inventory system generates a TSV export on a scheduled basis
2. The export is automatically emailed to Rylie AI's import address
3. Our system identifies your dealership from the email and subject
4. The TSV file is validated and processed
5. Your inventory is updated in the database
6. An import summary is sent to your designated contact

### Import Rules

- The system processes one import per day per dealership
- New vehicles are added to inventory
- Existing vehicles (matched by VIN) are updated
- Vehicles in the database but not in the import are marked as "Not Available"
- Validation errors are reported but don't stop the entire import

## TSV File Format

The system expects a Tab-Separated Values (TSV) file with specific columns. The first row must contain column headers.

### Required Columns

| Column Name | Description | Example |
|-------------|-------------|---------|
| vin | Vehicle Identification Number | 1HGCM82633A123456 |
| make | Vehicle manufacturer | Toyota |
| model | Vehicle model | RAV4 |
| year | Model year (numeric) | 2025 |
| trim | Trim level | XLE Premium |
| body_style | Body style/type | SUV |
| msrp | Manufacturer's suggested retail price | 32999 |
| sale_price | Dealership's sale price | 31495 |
| status | Availability status | Available |

### Optional Columns

| Column Name | Description | Example |
|-------------|-------------|---------|
| ext_color | Exterior color | Midnight Black Metallic |
| int_color | Interior color | Black Leather |
| mileage | Vehicle mileage (for used) | 12500 |
| engine | Engine description | 2.5L 4-Cylinder |
| transmission | Transmission type | 8-Speed Automatic |
| drivetrain | Drivetrain type | All-Wheel Drive |
| fuel_type | Fuel type | Hybrid |
| fuel_economy | Combined MPG | 40 |
| features | Comma-separated features | Sunroof, Navigation, Premium Audio |
| stock_number | Dealer stock number | T12345 |
| certified | Certified pre-owned status | Yes |
| description | Vehicle description | Well-maintained one-owner vehicle... |
| images | Comma-separated image URLs | https://example.com/img1.jpg, ... |
| video_url | URL to vehicle video | https://example.com/video.mp4 |

### Example TSV File

```
vin	make	model	year	trim	body_style	msrp	sale_price	status	ext_color	int_color	mileage	engine	transmission	drivetrain	fuel_type	fuel_economy	features	stock_number
1HGCM82633A123456	Toyota	RAV4	2025	XLE Premium	SUV	32999	31495	Available	Midnight Black Metallic	Black Leather	0	2.5L 4-Cylinder	8-Speed Automatic	All-Wheel Drive	Hybrid	40	Sunroof, Navigation, Premium Audio	T12345
5TFHY5F13MX063197	Toyota	Tacoma	2024	TRD Off-Road	Truck	42999	41995	Available	Army Green	Black Fabric	0	3.5L V6	6-Speed Manual	4x4	Gasoline	20	Off-Road Package, Tow Package	T54321
WAUFGCFL7CN123456	Audi	A4	2022	Premium Plus	Sedan	38995	36995	Available	Manhattan Gray Metallic	Brown Leather	12453	2.0L Turbo	7-Speed Automatic	Quattro	Gasoline	28	Technology Package, B&O Sound	A98765
```

### Special Formatting Rules

- Use tabs (not commas) as separators
- Do not use quotes around fields, even if they contain commas
- Use plain text format (.txt or .tsv)
- Use UTF-8 encoding
- Maximum file size: 10MB (approximately 5,000 vehicles)

## Manual Inventory Management

In addition to automated imports, you can manage inventory manually through the dashboard:

### Adding a Vehicle

1. Navigate to Inventory > Add Vehicle
2. Fill out the required fields
3. Add optional details and features
4. Upload vehicle images (optional)
5. Save the vehicle to add it to inventory

### Editing Vehicles

1. Find the vehicle in the inventory list
2. Click "Edit" to open the vehicle editor
3. Make necessary changes
4. Save to update the vehicle

### Bulk Actions

The system supports several bulk actions:
- Update status (Available/Sold/On Hold)
- Update pricing
- Delete vehicles
- Export to TSV

## Vehicle Data Structure

When a vehicle is imported or added, it's stored with the following structure:

```json
{
  "id": 12345,
  "dealershipId": 42,
  "vin": "1HGCM82633A123456",
  "stockNumber": "T12345",
  "make": "Toyota",
  "model": "RAV4",
  "year": 2025,
  "trim": "XLE Premium",
  "bodyStyle": "SUV",
  "extColor": "Midnight Black Metallic",
  "intColor": "Black Leather",
  "mileage": 0,
  "engine": "2.5L 4-Cylinder",
  "transmission": "8-Speed Automatic",
  "drivetrain": "All-Wheel Drive",
  "fuelType": "Hybrid",
  "fuelEconomy": 40,
  "msrp": 32999,
  "salePrice": 31495,
  "status": "Available",
  "certified": false,
  "description": "",
  "features": ["Sunroof", "Navigation", "Premium Audio"],
  "images": ["https://example.com/img1.jpg"],
  "videoUrl": "",
  "createdAt": "2025-05-20T14:30:00Z",
  "updatedAt": "2025-05-20T14:30:00Z",
  "lastImportId": 67890
}
```

This structure is used in the API and when Rylie AI references vehicles during conversations.

## Best Practices

### Email Import Best Practices

1. **Consistent Schedule**: Send updates at the same time each day
2. **Complete Inventory**: Always send your full inventory, not just changes
3. **Data Validation**: Clean your data before sending
4. **Monitor Results**: Check import reports regularly
5. **Stable Sender**: Use a consistent email address for sending

### Inventory Quality Tips

1. **Complete Descriptions**: Provide detailed descriptions for better AI conversations
2. **Accurate Pricing**: Keep pricing up-to-date
3. **Feature Details**: List all significant features
4. **Multiple Images**: Include multiple image URLs when possible
5. **Consistent Naming**: Use consistent terminology for trims and features

## Troubleshooting

### Common Email Import Issues

#### Import Email Not Received
- Verify the sender email is authorized
- Check that the email was sent to the correct address
- Check your email system's logs for delivery issues
- Ensure the attachment isn't too large (>10MB)

#### Import Validation Errors
- Check the format of your TSV file
- Ensure all required columns are present
- Verify data types (e.g., year must be numeric)
- Check for special characters or encoding issues

#### VIN Matching Issues
- Ensure VINs are correctly formatted
- Check for typos or transcription errors
- Verify VINs are actually 17 characters

#### Status Updates Not Working
- Verify the "status" column is present and correctly formatted
- Valid status values: Available, Sold, On Hold, Not Available
- Check import logs for specific errors

### Getting Help

If you encounter issues with the inventory system:

1. Check the Import Logs in the dashboard
2. Review the error messages in the import report
3. Contact support with:
   - Your dealership ID
   - The date and time of the import
   - The import ID (if available)
   - A copy of the TSV file that caused issues

Contact Rylie AI support at inventory-support@rylie-ai.com for assistance with inventory issues.