# Email Inventory Integration Guide for Rylie AI

## Overview

The Rylie AI platform can automatically process vehicle inventory data sent via email. This guide explains how dealerships can send inventory data as a TSV (Tab-Separated Values) file attachment to keep the Rylie AI system up-to-date with their current vehicle inventory.

## Email Format Requirements

### Email Addressing
- **To**: [Your organization's dedicated inventory email address]
- **Subject**: Must contain "Inventory Update" or other configured keyword for proper routing

### Attachment Requirements
- **File Type**: TSV (Tab-Separated Values) file
- **File Name**: Any name with `.tsv` extension
- **Encoding**: UTF-8

## TSV File Format

The attached TSV file must follow this specific format with the following columns:

| Column | Description | Required |
|--------|-------------|----------|
| Condition | Vehicle condition (New/Used) | Yes |
| Year | Model year (e.g., 2024) | Yes |
| Make | Manufacturer (e.g., Hyundai) | Yes |
| Model | Vehicle model (e.g., Santa Fe) | Yes |
| VIN | Vehicle Identification Number | Yes |
| Advertiser Name | Dealership name | No |
| Color | Exterior color | Yes |
| Description | Brief vehicle description | No |
| Doors | Number of doors | No |
| Drivetrain | Drivetrain type (e.g., AWD, FWD) | No |
| Formatted Price | Price with currency formatting (e.g., $45,995) | No |
| Fuel Type | Fuel type (Gasoline, Electric, etc.) | No |
| Image Type | Type of image (Stock, Dealer, etc.) | No |
| Image URL | URL to vehicle image | No |
| Mileage | Vehicle mileage | Yes |
| Price | Numeric price without formatting | Yes |
| Title | Full title for display purposes | No |
| Transmission | Transmission type | No |
| Trim | Trim level | No |
| Type | Body style (SUV, Sedan, etc.) | No |
| URL | URL to vehicle detail page | No |
| Vehicle Type | General vehicle category | No |
| stock_number | Dealer's stock number | Yes |

## Sample Email Setup

Here's an example of how to set up an email with inventory data:

1. Create a new email addressed to your organization's inventory processing address
2. Set the subject line to "Daily Inventory Update - [Dealership Name]"
3. Include a brief message in the body (optional)
4. Attach the TSV file with your current inventory data
5. Send the email

## TSV File Example

Here's a sample of how the TSV file should be formatted:

```
Condition	Year	Make	Model	VIN	Advertiser Name	Color	Description	Doors	Drivetrain	Formatted Price	Fuel Type	Image Type	Image URL	Mileage	Price	Title	Transmission	Trim	Type	URL	Vehicle Type	stock_number
New	2024	Hyundai	Ioniq 5	KM8KRDDF3RU249012	World Hyundai of Matteson	White	New 2024 Hyundai Ioniq 5	4	AWD	$59,277	Electric	Stock	https://example.com/images/ioniq5.jpg	10	59277.00	New 2024 Hyundai Ioniq 5 Limited AWD	Automatic	Limited AWD	SUV	https://example.com/inventory/ioniq5	Car_Truck	25713
Used	2021	Hyundai	Santa Fe	5NMS3DAJ6MH322835	World Hyundai of Matteson	Blue	Used 2021 Hyundai Santa Fe	4	AWD	$25,983	Gasoline	Stock	https://example.com/images/santafe.jpg	56825	25983.00	Used 2021 Hyundai Santa Fe Limited AWD	Automatic	Limited AWD	SUV	https://example.com/inventory/santafe	Car_Truck	27170A
```

## Important Notes

1. **Header Row**: The first row of the TSV file must contain the column headers exactly as specified above
2. **Daily Updates**: For optimal performance, send complete inventory updates once per day 
3. **Deleted Vehicles**: Vehicles that are no longer in your inventory will be marked as inactive after 30 days of not appearing in updates
4. **Data Validation**: The system performs automatic validation and will report any issues with the data format
5. **Processing Time**: Inventory updates are typically processed within 15 minutes of receipt

## Technical Requirements

- The TSV file must use tab characters (`\t`) as separators, not commas or other delimiters
- File size should not exceed 20MB
- For larger inventories, consider splitting the file or compressing it

## Confirmation and Error Reporting

After processing your inventory update, the system will send an email confirmation to the sender with:

- Number of vehicles processed
- Number of new vehicles added
- Number of vehicles updated
- Any errors encountered during processing

## Troubleshooting

If you encounter issues with inventory updates:

1. Verify the file format follows the TSV specifications outlined above
2. Ensure all required fields are present and properly formatted
3. Check that the VIN numbers are valid and unique
4. Verify the email was sent to the correct address with the proper subject line
5. Contact technical support if issues persist

## Contact Information

For help with inventory email integration:
- Technical Support: [support email/phone]
- Hours: [support hours]

---

*This document is confidential and intended for dealership partners only.*