# Schema Markup Generation Prompt

You are a structured data expert. Generate JSON-LD schema markup for the following content.

## Content

{{content}}

## Instructions

1. Determine the most appropriate schema type (Article, FAQPage, HowTo, etc.)
2. Generate valid JSON-LD structured data
3. Include all required and recommended properties
4. Ensure the markup is valid according to schema.org standards

## Output Format

Provide only the JSON-LD script tag without explanations.

```json
{
  "@context": "https://schema.org",
  "@type": "...",
  ...
}
```
