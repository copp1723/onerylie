# Setting Up A/B Testing Experiments

This guide explains how to use Rylie AI's A/B testing system to optimize AI responses and improve conversation outcomes.

## Table of Contents
1. [Introduction to A/B Testing](#introduction-to-ab-testing)
2. [Key Concepts](#key-concepts)
3. [A/B Testing Dashboard](#ab-testing-dashboard)
4. [Creating an Experiment](#creating-an-experiment)
5. [Creating Variants](#creating-variants)
6. [Tracking Metrics](#tracking-metrics)
7. [Running an Experiment](#running-an-experiment)
8. [Analyzing Results](#analyzing-results)
9. [Implementing Winners](#implementing-winners)
10. [Best Practices](#best-practices)
11. [Examples](#examples)

## Introduction to A/B Testing

A/B testing (also called split testing) is a method of comparing two versions of a prompt or persona to determine which one performs better. In Rylie AI, A/B testing allows you to:

- Test different prompt approaches
- Compare different tones or communication styles
- Experiment with various escalation criteria
- Optimize for specific outcomes (conversions, customer satisfaction, etc.)

The platform's A/B testing infrastructure automatically distributes traffic between variants and collects performance metrics to determine a winner.

## Key Concepts

- **Experiment**: A test comparing two or more variants with a specific goal
- **Variant**: A version of a prompt template or persona configuration
- **Control**: The baseline variant (typically your current production version)
- **Test Group**: New variants being tested against the control
- **Metric**: A measurement used to determine success (conversion rate, sentiment, etc.)
- **Traffic Allocation**: Percentage of conversations assigned to each variant
- **Statistical Significance**: Confidence level that observed differences aren't due to chance

## A/B Testing Dashboard

The A/B Testing Dashboard is accessible from the main navigation menu and provides:
- Overview of all experiments (active and completed)
- Performance metrics and comparisons
- Experiment creation and management tools
- Results analysis and visualization

![A/B Testing Dashboard](https://assets.rylie-ai.com/docs/abtest-dashboard.png)

## Creating an Experiment

To create a new A/B testing experiment:

1. Navigate to A/B Testing > Create Experiment
2. Fill out the experiment details:
   - **Name**: A descriptive name (e.g., "May 2025 Greeting Style Test")
   - **Description**: Purpose and hypothesis of the experiment
   - **Start Date**: When the experiment should begin
   - **End Date**: When the experiment should end (2-4 weeks recommended)
   - **Dealership**: Which dealership this experiment applies to
   - **Primary Metric**: The main measurement of success
   - **Secondary Metrics**: Additional metrics to track

3. Set traffic allocation:
   - Determine what percentage of conversations will participate in the test
   - Default is 50% (the other 50% uses your default persona)

4. Configure variant distribution:
   - How traffic will be split between variants
   - For two variants, an even 50/50 split is recommended

5. Save the experiment (it will remain inactive until you add variants)

## Creating Variants

Each experiment requires at least two variants:

### Control Variant
1. In your experiment, click "Add Control Variant"
2. Select an existing persona or create a new one
3. This will be your baseline for comparison

### Test Variant(s)
1. Click "Add Test Variant"
2. Create a new persona or duplicate and modify the control
3. Make the specific changes you want to test
4. Give the variant a descriptive name

### Important: Isolated Changes

For meaningful results, each variant should differ in only ONE aspect. Examples of good isolated changes:

- Different greeting styles
- Different tone (formal vs. conversational)
- Different escalation thresholds
- Different feature emphasis

Avoid testing multiple changes at once, as you won't know which change caused any difference in performance.

## Tracking Metrics

Rylie AI supports several metrics for A/B testing:

### Conversation Metrics
- **Conversation Length**: Number of messages exchanged
- **Response Time**: How quickly the customer responds
- **Session Duration**: Total time of the conversation
- **Abandonment Rate**: Percentage of conversations where customer stops responding

### Outcome Metrics
- **Handover Rate**: Percentage of conversations escalated to humans
- **Conversion Rate**: Percentage resulting in a defined goal (appointment, application, etc.)
- **Customer Sentiment**: Positive/negative sentiment analysis of customer messages
- **Satisfaction Score**: If you collect explicit feedback

### Custom Metrics
You can also create custom metrics based on:
- Specific keywords in customer responses
- Particular conversation paths
- Time-based thresholds
- Combinations of other metrics

## Running an Experiment

Once your experiment and variants are configured:

1. Review all settings and variants
2. Click "Activate Experiment" to start
3. The system will:
   - Randomly assign conversations to variants based on your traffic allocation
   - Collect metrics for each variant
   - Calculate statistical significance
   - Generate real-time reports

During the experiment:
- Monitor performance in the dashboard
- Don't make changes to the variants
- Let the experiment run for the full duration for reliable results
- Check for any unexpected issues or skewed results

## Analyzing Results

After the experiment concludes (or reaches statistical significance):

1. Navigate to the experiment in the A/B Testing Dashboard
2. View the Results tab for:
   - Winner determination
   - Performance comparison across all metrics
   - Statistical confidence level
   - Graphs and visualizations
   - Raw data export option

The system automatically calculates:
- Percent improvement over control
- Statistical significance (95% confidence level required for a valid result)
- Impact projections (estimated improvement if implemented)

### Understanding Statistical Significance

The platform uses standard statistical methods to determine if results are significant:
- Green: 95%+ confidence (strong evidence of real difference)
- Yellow: 85-95% confidence (suggestive but not conclusive)
- Red: <85% confidence (insufficient evidence, may be random variation)

Only implement changes with green (95%+) confidence levels.

## Implementing Winners

When a variant shows statistically significant improvement:

1. Navigate to the experiment results
2. Click "Implement Winner"
3. Choose implementation options:
   - Replace default persona with winning variant
   - Create new persona based on the winner
   - Merge winning elements into existing persona

4. Review and confirm the implementation
5. Set the implementation date and time

The system will automatically:
- Update the relevant persona(s)
- Archive the experiment with full results
- Create a record of the implementation

## Best Practices

### Experiment Design
- **Test one change at a time** for clear cause-effect relationships
- **Run experiments for at least 2 weeks** to account for day/time variations
- **Set clear hypotheses** before starting tests
- **Ensure sufficient sample size** (minimum 100 conversations per variant)
- **Don't run multiple experiments** on the same traffic simultaneously

### Metric Selection
- Choose metrics that directly relate to business goals
- Include both short-term and long-term metrics
- Consider both quantitative and qualitative measures
- Ensure metrics are consistently measurable

### Variant Creation
- Make meaningful but isolated changes
- Document all differences between variants
- Ensure variants are technically sound before testing
- Test bold changes for more noticeable results

### Analysis
- Wait for statistical significance before drawing conclusions
- Consider external factors that might influence results
- Look for patterns across multiple metrics
- Be willing to accept when tests show no significant difference

## Examples

### Example 1: Greeting Style Test

**Hypothesis**: A personalized greeting with the customer's name will increase engagement compared to a generic greeting.

**Control Variant**: 
```
Hello! Welcome to Lincoln Valley Ford. How can I assist you today?
```

**Test Variant**:
```
Hello {{customerName}}! Welcome to Lincoln Valley Ford. How can I assist you today?
```

**Primary Metric**: Conversation continuation rate (% of customers who respond after initial greeting)

**Results**: The personalized greeting showed a 12% improvement in conversation continuation with 97% statistical significance.

### Example 2: Feature Emphasis Test

**Hypothesis**: Emphasizing safety features will resonate better than emphasizing technology features.

**Control Variant** (Technology emphasis):
```
Our vehicles come equipped with the latest technology features including 10" touchscreen displays, wireless charging, smartphone integration, and voice commands.
```

**Test Variant** (Safety emphasis):
```
Our vehicles come equipped with advanced safety features including automatic emergency braking, lane-keeping assist, blind-spot monitoring, and adaptive cruise control.
```

**Primary Metric**: Positive sentiment in customer responses

**Results**: The safety emphasis variant showed a 23% increase in positive sentiment with 98% statistical significance.

### Example 3: Escalation Threshold Test

**Hypothesis**: Escalating to a human representative sooner in the buying process will increase conversion rates.

**Control Variant** (Late escalation):
```
ESCALATION CRITERIA:
- Customer explicitly asks for a human
- After pricing discussion
- When financing details are requested
- After 8+ message exchanges
```

**Test Variant** (Early escalation):
```
ESCALATION CRITERIA:
- Customer explicitly asks for a human
- When specific vehicle questions are asked
- When any pricing is mentioned
- After 4+ message exchanges
```

**Primary Metric**: Appointment booking rate

**Results**: The early escalation variant showed a 15% improvement in appointment bookings with 96% statistical significance.

---

For additional support with A/B testing, contact the Rylie AI support team at support@rylie-ai.com