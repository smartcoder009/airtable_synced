const Airtable = require('airtable');
const dotenv = require('dotenv');
dotenv.config();

const base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE_ID);

async function bundleAirtableData(table, recordId, view) {
    const schema = await generateJSONSchema(table);
    const uiSchema = await generateUISchema(table, view);
    const formData = await fetchFormData(table, recordId);

    return {
        schema,
        uiSchema,
        formData
    };
}

async function generateJSONSchema(table) {
    const schema = {title: table, type: 'object', properties: {}};
    await base(table).select({ maxRecords: 1 }).firstPage((err, records) => {
        if(err) { 
            console.error(err);
            return;
        }

        records.forEach(record => {
            Object.keys(record.fields).forEach(field => {
                schema.properties[field] = {type: getDataType(record.get(field))};
            });
        });
    });
    return schema;
}

async function generateUISchema(table, view) {
    const uiSchema = {};

    try {
        const records = await base(table).select({
            view: view,
            maxRecords: 1,
            fields: [],
        }).firstPage();

        if(records.length > 0) {
            const fields = records[0].fields;

            Object.keys(fields).forEach((fieldName) => {
                uiSchema[fieldName] = getUISchemaForField(fields[fieldName]);
            });
        }
    } catch (error) {
        console.error('Error generating UIScheam for table ${table} view ${view}:', error);
    }

    return uiSchema;
}

function getUISchemaForField(field) {
    const uiElement = {};
    const type = getDataType(field);
    switch(type) {
        case 'array':
            uiElement['ui:widget'] = 'array';
            break;
        case 'number':
            uiElement['ui:widget'] = 'updown';
            break;
        case 'string':
            uiElement['ui:widget'] = 'text';
            break;
        case 'date':
            uiElement['ui:widget'] = 'date';
            break;
        case 'boolean':
            uiElement['ui:widget'] = 'checkbox';
            break;
        default:
            uiElement['ui:widget'] = 'text';  // Default to a text widget
            break;
    }

    if (field.isVisible === false) {
        uiElement['ui:widget'] = 'hidden';  // Hide fields marked as not visible
    }
    
    return uiElement;
}

const getDataType = (value) => {
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    if (typeof value === 'string') {
      // Check if the string represents a valid date
      const parsedDate = Date.parse(value);
      if (!isNaN(parsedDate)) {
        const date = new Date(parsedDate);
        if (date instanceof Date && !isNaN(date)) return 'date';
      }
    }
    return typeof value; // Return 'string', 'number', 'boolean', 'object', etc.
};

// Fetch form data from Airtable for the selected record
async function fetchFormData(table, recordId) {
    return new Promise((resolve, reject) => {
      base(table).find(recordId, (err, record) => {
        if (err) { reject(err); return; }
        resolve(record.fields);
      });
    });
}

module.exports = {
    bundleAirtableData
};