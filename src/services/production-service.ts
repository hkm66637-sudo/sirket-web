import { supabase } from "@/lib/supabase/client";

export interface Product {
  id: string;
  company_id: string;
  sku: string;
  name: string;
  default_machine_id?: string;
  average_duration_minutes: number;
}

export interface RawMaterial {
  id: string;
  company_id: string;
  name: string;
  unit: string;
  current_stock: number;
  reserved_stock: number;
  minimum_stock: number;
  critical_stock: number;
  supplier_name?: string;
  lead_time_days: number;
}

export interface Machine {
  id: string;
  company_id: string;
  name: string;
  code: string;
  capacity_units_per_hour: number;
  status: 'active' | 'maintenance' | 'broken';
  last_maintenance_date?: string;
  description?: string;
}

export interface ProductionOrder {
  id: string;
  company_id: string;
  order_no: string;
  customer_name: string;
  product_id: string;
  quantity: number;
  target_date: string;
  status: string;
  priority: 'normal' | 'acil' | 'cok_acil';
  machine_id?: string;
  assigned_person_id?: string;
  estimated_duration_minutes?: number;
  actual_duration_minutes?: number;
  notes?: string;
  created_at: string;
  products?: Product;
  machines?: Machine;
}

export const ProductionService = {
  // --- FETCH QUERIES ---
  async getOrders(companyId: string) {
    const { data, error } = await supabase
      .from("production_orders")
      .select(`
        *,
        products:product_id (id, name, sku),
        machines:machine_id (id, name, code)
      `)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getProducts(companyId: string) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("company_id", companyId);

    if (error) throw error;
    return data || [];
  },

  async getProductRecipes(productId: string) {
    const { data, error } = await supabase
      .from("product_recipes")
      .select(`
        *,
        raw_materials:raw_material_id (*)
      `)
      .eq("product_id", productId);

    if (error) throw error;
    return data || [];
  },

  async getRawMaterials(companyId: string) {
    const { data, error } = await supabase
      .from("raw_materials")
      .select("*")
      .eq("company_id", companyId);

    if (error) throw error;
    return data || [];
  },

  async getMachines(companyId: string) {
    const { data, error } = await supabase
      .from("machines")
      .select("*")
      .eq("company_id", companyId);

    if (error) throw error;
    return data || [];
  },

  async getPurchaseRequests(companyId: string) {
    const { data, error } = await supabase
      .from("purchase_requests")
      .select(`
        *,
        raw_materials:raw_material_id (name, unit)
      `)
      .eq("company_id", companyId);

    if (error) throw error;
    return data || [];
  },

  // --- MUTATIONS ---
  async createOrder(order: Partial<ProductionOrder>) {
    const { data, error } = await supabase
      .from("production_orders")
      .insert([order])
      .select();

    if (error) throw error;
    return data?.[0];
  },

  async updateOrderStatus(orderId: string, status: string, message?: string) {
    const { error } = await supabase
      .from("production_orders")
      .update({ status })
      .eq("id", orderId);

    if (error) throw error;

    // Create log entry
    await supabase.from("production_logs").insert([{
      order_id: orderId,
      status_to: status,
      message: message || `Durum ${status} olarak güncellendi.`
    }]);
  },

  // --- ADVANCED WORKFLOW: TAKE TO PRODUCTION ---
  async takeToProduction(orderId: string, companyId: string) {
    // 1. Fetch the order details
    const { data: order, error: oErr } = await supabase
      .from("production_orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (oErr || !order) throw new Error("İş emri bulunamadı.");

    // 2. Fetch recipe
    const { data: recipe, error: rErr } = await supabase
      .from("product_recipes")
      .select("*")
      .eq("product_id", order.product_id);

    if (rErr) throw new Error("Reçete bilgisi alınamadı.");
    if (!recipe || recipe.length === 0) throw new Error("Bu ürün için tanımlı bir reçete bulunamadı.");

    let stockMissing = false;
    const missingMaterials: { materialId: string; needed: number; supplier?: string }[] = [];

    // 3. Check raw material stock
    for (const item of recipe) {
      const { data: mat, error: mErr } = await supabase
        .from("raw_materials")
        .select("*")
        .eq("id", item.raw_material_id)
        .single();

      if (mErr || !mat) continue;

      const qtyNeeded = parseFloat(item.quantity_per_unit) * order.quantity;
      const fireAmount = qtyNeeded * (parseFloat(item.fire_rate_percent || 0) / 100);
      const totalNeeded = qtyNeeded + fireAmount;

      const availableStock = parseFloat(mat.current_stock || 0) - parseFloat(mat.reserved_stock || 0);

      if (availableStock < totalNeeded) {
        stockMissing = true;
        missingMaterials.push({
          materialId: mat.id,
          needed: totalNeeded - availableStock,
          supplier: mat.supplier_name
        });
      }
    }

    if (stockMissing) {
      // Create Purchase Requests
      for (const miss of missingMaterials) {
        await supabase.from("purchase_requests").insert([{
          company_id: companyId,
          raw_material_id: miss.materialId,
          quantity_needed: miss.needed,
          supplier_name: miss.supplier,
          status: "pending"
        }]);
      }

      await supabase.from("production_notifications").insert([{
        company_id: companyId,
        message: `${order.order_no} nolu sipariş için hammadde yetersiz. Satın alma talepleri oluşturuldu.`,
        type: "warning"
      }]);

      throw new Error("Stok yetersiz! Satın alma talepleri otomatik oluşturuldu.");
    }

    // 4. Reserve stock since materials are available
    for (const item of recipe) {
      const qtyNeeded = parseFloat(item.quantity_per_unit) * order.quantity;
      const fireAmount = qtyNeeded * (parseFloat(item.fire_rate_percent || 0) / 100);
      const totalNeeded = qtyNeeded + fireAmount;

      // Increment reserved stock
      const { data: mat } = await supabase
        .from("raw_materials")
        .select("reserved_stock")
        .eq("id", item.raw_material_id)
        .single();

      const newReserved = parseFloat(mat?.reserved_stock || 0) + totalNeeded;

      await supabase
        .from("raw_materials")
        .update({ reserved_stock: newReserved })
        .eq("id", item.raw_material_id);

      // Create Reserve Movement
      await supabase.from("raw_material_movements").insert([{
        raw_material_id: item.raw_material_id,
        order_id: orderId,
        type: "reserve",
        quantity: totalNeeded
      }]);
    }

    // 5. Update Order Status
    await this.updateOrderStatus(orderId, "üretime_alındı", "Üretim başladı. Hammaddeler rezerve edildi.");
  },

  // --- ADVANCED WORKFLOW: FINALIZE PRODUCTION ---
  async finalizeProduction(orderId: string, companyId: string, fireQuantity = 0) {
    const { data: order } = await supabase
      .from("production_orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (!order) throw new Error("Sipariş bulunamadı.");

    const { data: recipe } = await supabase
      .from("product_recipes")
      .select("*")
      .eq("product_id", order.product_id);

    // Deducing actual stock and cleaning reserve
    if (recipe) {
      for (const item of recipe) {
        const qtyNeeded = parseFloat(item.quantity_per_unit) * order.quantity;
        const fireAmount = qtyNeeded * (parseFloat(item.fire_rate_percent || 0) / 100);
        const totalNeeded = qtyNeeded + fireAmount;

        const { data: mat } = await supabase
          .from("raw_materials")
          .select("current_stock, reserved_stock")
          .eq("id", item.raw_material_id)
          .single();

        const newCurrent = parseFloat(mat?.current_stock || 0) - totalNeeded;
        const newReserved = Math.max(0, parseFloat(mat?.reserved_stock || 0) - totalNeeded);

        await supabase
          .from("raw_materials")
          .update({ current_stock: newCurrent, reserved_stock: newReserved })
          .eq("id", item.raw_material_id);

        await supabase.from("raw_material_movements").insert([{
          raw_material_id: item.raw_material_id,
          order_id: orderId,
          type: "consumption",
          quantity: totalNeeded
        }]);
      }
    }

    // Status transition to accounting approval phase
    await this.updateOrderStatus(orderId, "muhasebe_onayı", "Üretim başarıyla bitti. Muhasebe onayı bekleniyor.");

    await supabase.from("production_notifications").insert([{
      company_id: companyId,
      message: `${order.order_no} üretimi bitti. Sevkiyat için muhasebe onayı gereklidir.`,
      type: "success"
    }]);
  }
};
