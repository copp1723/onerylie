# Rylie AI Inventory Import System

## Overview

The Rylie AI platform includes an inventory import system that processes daily TSV (Tab-Separated Values) files received via email. This document explains how to set up, configure, and use the inventory import feature.

## Daily TSV File Format

The inventory data is received in TSV format with the following expected columns:

| Column | Description | Required |
|--------|-------------|----------|
| VIN | Vehicle Identification Number | Yes |
| StockNumber | Dealer's stock number | No (fallback identifier if VIN is missing) |
| Make | Vehicle manufacturer | Yes |
| Model | Vehicle model | Yes |
| Year | Model year | Yes |
| Trim | Trim level | No |
| ExteriorColor | Exterior color (or "Color") | Yes |
| InteriorColor | Interior color | No |
| Mileage | Odometer reading | Yes |
| Price | Selling price | Yes |
| MSRP | Manufacturer's suggested retail price | No |
| BodyStyle | Body style (sedan, SUV, etc.) | Yes |
| Transmission | Transmission type | No |
| Engine | Engine details | No |
| FuelType | Fuel type | No |
| Drivetrain | Drivetrain type (FWD, AWD, etc.) | No |
| Features | Comma-separated list of features | No |
| Images | Comma-separated list of image URLs | No |

Example TSV content:
```
VIN	StockNumber	Make	Model	Year	Trim	ExteriorColor	InteriorColor	Mileage	Price	MSRP	BodyStyle	Transmission	Engine	FuelType	Drivetrain	Features	Images
1HGCM82633A123456	S12345	Honda	Accord	2023	Touring	Crystal Black	Black Leather	15	32000	34500	Sedan	Automatic	2.0L Turbo	Gasoline	FWD	Navigation,Sunroof,Heated Seats	https://example.com/car1.jpg,https://example.com/car1b.jpg
5TFCZ5AN0MX123456	T54321	Toyota	Tacoma	2022	TRD Off-Road	Army Green	Black Cloth	1200	39500	41000	Truck	Automatic	3.5L V6	Gasoline	4WD	Tow Package,Off-Road Package,Backup Camera	https://example.com/truck1.jpg
```

## Setting Up Email Integration

To set up the daily inventory import via email:

1. Configure an email forwarding rule or webhook that will send the TSV attachment to the Rylie AI API endpoint.

2. The endpoint for receiving inventory data is:
   ```
   POST /api/inventory/import/tsv
   ```

3. The API request should include:
   - API key in the `X-API-Key` header for authentication
   - JSON payload with:
     - `dealershipId`: The ID of the dealership receiving the inventory update
     - `attachmentContent`: The full TSV file content as a string
     - `fileName`: (Optional) Original email attachment filename
     - `emailSubject`: (Optional) Subject of the original email
     - `emailSender`: (Optional) Email address of the sender
     - `emailDate`: (Optional) Date the email was received

### Example API Request

```bash
curl -X POST https://your-rylie-instance.com/api/inventory/import/tsv \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "dealershipId": 1,
    "attachmentContent": "VIN\tStockNumber\tMake\tModel\tYear\tTrim\tExteriorColor\tInteriorColor\tMileage\tPrice\tMSRP\tBodyStyle\tTransmission\tEngine\tFuelType\tDrivetrain\tFeatures\tImages\n1HGCM82633A123456\tS12345\tHonda\tAccord\t2023\tTouring\tCrystal Black\tBlack Leather\t15\t32000\t34500\tSedan\tAutomatic\t2.0L Turbo\tGasoline\tFWD\tNavigation,Sunroof,Heated Seats\thttps://example.com/car1.jpg",
    "fileName": "inventory_update_2025_05_22.tsv",
    "emailSubject": "Daily Inventory Update",
    "emailSender": "inventory@dealer-system.com",
    "emailDate": "2025-05-22T08:00:00Z"
  }'
```

## Import Process

The inventory import process follows these steps:

1. The system receives the TSV file content through the API endpoint.
2. The content is parsed line by line, with the first line expected to be column headers.
3. For each vehicle entry:
   - Data is mapped to the internal vehicle schema
   - The system checks if the vehicle already exists using the VIN
   - If the vehicle exists, its record is updated
   - If the vehicle is new, a new record is created
4. Import statistics are generated and returned as part of the API response

### Handling Updates vs. New Vehicles

The system uses the VIN (Vehicle Identification Number) as the primary identifier for vehicles. When processing inventory updates:

- If a vehicle with the same VIN already exists in the database, its information is updated with the new data from the TSV file
- If no matching VIN is found, a new vehicle record is created
- Vehicles in the database that are not present in the latest import are not automatically removed

## Checking Import Status

You can check the status of inventory imports and current inventory statistics using the following endpoint:

```
GET /api/inventory/import/stats
```

This requires an API key in the `X-API-Key` header and returns:
- Current inventory count
- Date/time of the last inventory update
- Statistics on recent imports

## Testing the Import Process

A test script is included to help verify that the inventory import system is working correctly:

```bash
npx tsx scripts/test-inventory-import.ts
```

This script:
1. Creates a sample TSV file with test vehicle data
2. Sends it to the inventory import API
3. Verifies that the vehicles were properly imported
4. Displays import statistics

## Troubleshooting

### Common Issues

1. **Missing Required Fields**: Ensure that all required fields (VIN, Make, Model, Year, etc.) are present in the TSV file
2. **Malformed TSV**: Check that the file uses tab characters as separators, not commas or other delimiters
3. **Duplicate VINs**: If multiple vehicles have the same VIN, only the last one processed will be saved
4. **API Authentication**: Verify that a valid API key with proper permissions is being used

### Error Handling

The import process includes error handling at several levels:

- File-level validation to ensure the TSV is properly formatted
- Line-by-line processing that continues even if individual vehicle entries have errors
- Detailed error reporting in the API response

## Integrating with Email Services

For email services that support webhooks or automatic forwarding, set up a rule to:

1. Filter for emails with TSV attachments (usually with a specific subject line or from a specific sender)
2. Extract the TSV attachment
3. Forward the content to the Rylie AI inventory import API endpoint

Popular email services that can be integrated include:
- SendGrid (using Inbound Parse)
- Mailgun (using Routes)
- Amazon SES (with Lambda functions)
- Microsoft Exchange/Outlook (with Flow)