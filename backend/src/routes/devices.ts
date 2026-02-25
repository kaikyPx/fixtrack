import { Router } from 'express';
import pool from '../config/database.js';

const router = Router();

// GET /api/devices
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, customer_id as customerId, type, brand, model, imei_or_serial as imeiOrSerial, color, storage,
        serial_number as serialNumber, screen_password as screenPassword, battery_health as batteryHealth, is_return as isReturn,
        condition_screen_ok as conditionScreenOk, condition_case_ok as conditionCaseOk,
        condition_camera_ok as conditionCameraOk, condition_impact_signs as conditionImpactSigns,
        condition_liquid_damage_signs as conditionLiquidDamageSigns, entry_date as entryDate, entry_method as entryMethod,
        received_by as receivedBy, priority, estimated_deadline as estimatedDeadline, has_loaner_device as hasLoanerDevice,
        loaner_model as loanerModel, loaner_imei as loanerImei, loaner_delivery_date as loanerDeliveryDate,
        liability_term as liabilityTerm, entry_video_url as entryVideo, exit_video_url as exitVideo,
        device_documentation_urls as deviceDocumentation, additional_documents_urls as additionalDocuments,
        accessories, observations,
        purchase_date as purchaseDate, warranty_period_months as warrantyPeriodMonths, warranty_end_date as warrantyEndDate,
        supplier_id as supplierId, supplier_name as supplierName, stock_entry_date as stockEntryDate,
        supplier_warranty_months as supplierWarrantyMonths, supplier_warranty_end_date as supplierWarrantyEndDate
       FROM devices ORDER BY created_at DESC`
    );
    res.json({ devices: rows });
  } catch (error) {
    console.error('Erro ao buscar dispositivos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/devices/customer/:customerId
router.get('/customer/:customerId', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, customer_id as customerId, type, brand, model, imei_or_serial as imeiOrSerial, color, storage,
        serial_number as serialNumber, screen_password as screenPassword, battery_health as batteryHealth, is_return as isReturn,
        condition_screen_ok as conditionScreenOk, condition_case_ok as conditionCaseOk,
        condition_camera_ok as conditionCameraOk, condition_impact_signs as conditionImpactSigns,
        condition_liquid_damage_signs as conditionLiquidDamageSigns, entry_date as entryDate, entry_method as entryMethod,
        received_by as receivedBy, priority, estimated_deadline as estimatedDeadline, has_loaner_device as hasLoanerDevice,
        loaner_model as loanerModel, loaner_imei as loanerImei, loaner_delivery_date as loanerDeliveryDate,
        liability_term as liabilityTerm, entry_video_url as entryVideo, exit_video_url as exitVideo,
        device_documentation_urls as deviceDocumentation, additional_documents_urls as additionalDocuments,
        accessories, observations,
        purchase_date as purchaseDate, warranty_period_months as warrantyPeriodMonths, warranty_end_date as warrantyEndDate,
        supplier_id as supplierId, supplier_name as supplierName, stock_entry_date as stockEntryDate,
        supplier_warranty_months as supplierWarrantyMonths, supplier_warranty_end_date as supplierWarrantyEndDate
       FROM devices WHERE customer_id = ?`,
      [req.params.customerId]
    );
    res.json({ devices: rows });
  } catch (error) {
    console.error('Erro ao buscar dispositivos do cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/devices/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, customer_id as customerId, type, brand, model, imei_or_serial as imeiOrSerial, color, storage,
        serial_number as serialNumber, screen_password as screenPassword, battery_health as batteryHealth, is_return as isReturn,
        condition_screen_ok as conditionScreenOk, condition_case_ok as conditionCaseOk,
        condition_camera_ok as conditionCameraOk, condition_impact_signs as conditionImpactSigns,
        condition_liquid_damage_signs as conditionLiquidDamageSigns, entry_date as entryDate, entry_method as entryMethod,
        received_by as receivedBy, priority, estimated_deadline as estimatedDeadline, has_loaner_device as hasLoanerDevice,
        loaner_model as loanerModel, loaner_imei as loanerImei, loaner_delivery_date as loanerDeliveryDate,
        liability_term as liabilityTerm, entry_video_url as entryVideo, exit_video_url as exitVideo,
        device_documentation_urls as deviceDocumentation, additional_documents_urls as additionalDocuments,
        accessories, observations,
        purchase_date as purchaseDate, warranty_period_months as warrantyPeriodMonths, warranty_end_date as warrantyEndDate,
        supplier_id as supplierId, supplier_name as supplierName, stock_entry_date as stockEntryDate,
        supplier_warranty_months as supplierWarrantyMonths, supplier_warranty_end_date as supplierWarrantyEndDate
       FROM devices WHERE id = ?`,
      [req.params.id]
    );
    const devices = rows as any[];
    if (devices.length === 0) {
      return res.status(404).json({ error: 'Dispositivo não encontrado' });
    }
    res.json({ device: devices[0] });
  } catch (error) {
    console.error('Erro ao buscar dispositivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/devices
router.post('/', async (req, res) => {
  try {
    const { id, customerId, type, brand, model, imeiOrSerial, color, storage, serialNumber, screenPassword, batteryHealth, isReturn, accessories, observations,
      conditionOnArrival, supportEntryData, loanerDevice, mediaFiles, purchaseDate, warrantyPeriodMonths, warrantyEndDate, supplierId, supplierName,
      stockEntryDate, supplierWarrantyMonths, supplierWarrantyEndDate } = req.body;

    await pool.execute(
      `INSERT INTO devices (id, customer_id, type, brand, model, imei_or_serial, color, storage, serial_number,
        screen_password, battery_health, is_return,
        condition_screen_ok, condition_case_ok, condition_camera_ok, condition_impact_signs, condition_liquid_damage_signs,
        entry_date, entry_method, received_by, priority, estimated_deadline,
        has_loaner_device, loaner_model, loaner_imei, loaner_delivery_date, liability_term,
        entry_video_url, exit_video_url, device_documentation_urls, additional_documents_urls,
        accessories, observations, purchase_date, warranty_period_months, warranty_end_date,
        supplier_id, supplier_name, stock_entry_date, supplier_warranty_months, supplier_warranty_end_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id ?? null, customerId ?? null, type ?? null, brand ?? null, model ?? null, imeiOrSerial || null, color || null, storage || null, serialNumber || null,
      screenPassword || null, batteryHealth || null, isReturn ?? false,
      conditionOnArrival?.screenOk ?? null, conditionOnArrival?.caseOk ?? null, conditionOnArrival?.cameraOk ?? null,
      conditionOnArrival?.impactSigns ?? null, conditionOnArrival?.liquidDamageSigns ?? null,
      supportEntryData?.entryDate ? new Date(supportEntryData.entryDate) : null,
      supportEntryData?.entryMethod || null, supportEntryData?.receivedBy || null, supportEntryData?.priority || null,
      supportEntryData?.estimatedDeadline ? new Date(supportEntryData.estimatedDeadline) : null,
      loanerDevice?.hasLoaner ?? null, loanerDevice?.model || null, loanerDevice?.imei || null,
      loanerDevice?.deliveryDate ? new Date(loanerDevice.deliveryDate) : null, loanerDevice?.liabilityTerm ?? null,
      mediaFiles?.entryVideo || null, mediaFiles?.exitVideo || null,
      mediaFiles?.deviceDocumentation ? JSON.stringify(mediaFiles.deviceDocumentation) : null,
      mediaFiles?.additionalDocuments ? JSON.stringify(mediaFiles.additionalDocuments) : null,
      accessories || null, observations || null,
      purchaseDate ? new Date(purchaseDate) : null, warrantyPeriodMonths ?? null, warrantyEndDate ? new Date(warrantyEndDate) : null,
      supplierId || null, supplierName || null, stockEntryDate ? new Date(stockEntryDate) : null,
      supplierWarrantyMonths ?? null, supplierWarrantyEndDate ? new Date(supplierWarrantyEndDate) : null]
    );

    res.status(201).json({
      device: {
        id, customerId, type, brand, model, imeiOrSerial, color, storage, serialNumber, screenPassword, batteryHealth, isReturn, accessories, observations,
        conditionOnArrival, supportEntryData, loanerDevice, mediaFiles, purchaseDate, warrantyPeriodMonths, warrantyEndDate, supplierId, supplierName,
        stockEntryDate, supplierWarrantyMonths, supplierWarrantyEndDate
      }
    });
  } catch (error) {
    console.error('Erro ao criar dispositivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/devices/:id
router.put('/:id', async (req, res) => {
  try {
    const { type, brand, model, imeiOrSerial, color, storage, serialNumber, screenPassword, batteryHealth, isReturn, accessories, observations,
      conditionOnArrival, supportEntryData, loanerDevice, mediaFiles, purchaseDate, warrantyPeriodMonths, warrantyEndDate, supplierId, supplierName,
      stockEntryDate, supplierWarrantyMonths, supplierWarrantyEndDate } = req.body;

    await pool.execute(
      `UPDATE devices SET type = ?, brand = ?, model = ?, imei_or_serial = ?, color = ?, storage = ?, serial_number = ?,
        screen_password = ?, battery_health = ?, is_return = ?,
        condition_screen_ok = ?, condition_case_ok = ?, condition_camera_ok = ?, condition_impact_signs = ?, condition_liquid_damage_signs = ?,
        entry_date = ?, entry_method = ?, received_by = ?, priority = ?, estimated_deadline = ?,
        has_loaner_device = ?, loaner_model = ?, loaner_imei = ?, loaner_delivery_date = ?, liability_term = ?,
        entry_video_url = ?, exit_video_url = ?, device_documentation_urls = ?, additional_documents_urls = ?,
        accessories = ?, observations = ?, purchase_date = ?, warranty_period_months = ?, warranty_end_date = ?,
        supplier_id = ?, supplier_name = ?, stock_entry_date = ?, supplier_warranty_months = ?, supplier_warranty_end_date = ?
       WHERE id = ?`,
      [type ?? null, brand ?? null, model ?? null, imeiOrSerial || null, color || null, storage || null, serialNumber || null,
      screenPassword || null, batteryHealth || null, isReturn ?? false,
      conditionOnArrival?.screenOk || null, conditionOnArrival?.caseOk || null, conditionOnArrival?.cameraOk || null,
      conditionOnArrival?.impactSigns || null, conditionOnArrival?.liquidDamageSigns || null,
      supportEntryData?.entryDate ? new Date(supportEntryData.entryDate) : null,
      supportEntryData?.entryMethod || null, supportEntryData?.receivedBy || null, supportEntryData?.priority || null,
      supportEntryData?.estimatedDeadline ? new Date(supportEntryData.estimatedDeadline) : null,
      loanerDevice?.hasLoaner || null, loanerDevice?.model || null, loanerDevice?.imei || null,
      loanerDevice?.deliveryDate ? new Date(loanerDevice.deliveryDate) : null, loanerDevice?.liabilityTerm || null,
      mediaFiles?.entryVideo || null, mediaFiles?.exitVideo || null,
      mediaFiles?.deviceDocumentation ? JSON.stringify(mediaFiles.deviceDocumentation) : null,
      mediaFiles?.additionalDocuments ? JSON.stringify(mediaFiles.additionalDocuments) : null,
      accessories || null, observations || null,
      purchaseDate ? new Date(purchaseDate) : null, warrantyPeriodMonths ?? null, warrantyEndDate ? new Date(warrantyEndDate) : null,
      supplierId || null, supplierName || null, stockEntryDate ? new Date(stockEntryDate) : null,
      supplierWarrantyMonths ?? null, supplierWarrantyEndDate ? new Date(supplierWarrantyEndDate) : null, req.params.id]
    );

    res.json({ message: 'Dispositivo atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar dispositivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/devices/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM devices WHERE id = ?', [req.params.id]);
    res.json({ message: 'Dispositivo excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir dispositivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
