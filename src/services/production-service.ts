import { supabase } from "@/lib/supabase/client";

export interface Product {
  id: string;
  company_id: string;
  sku: string;
  name: string;
  default_machine_id?: string;
  average_duration_minutes: number;
  category?: string;
  raw_material_type?: string;
  product_color?: string;
  material_color?: string;
  variations?: string[];
  machine_id?: string;
  product_label?: string;
  image_url?: string;
  cutting_blade_model?: string;
  production_time_minutes?: number;
  daily_production_capacity?: number;
  mold_count?: number;
}

export interface ProductionRecipe {
  id: string;
  product_id: string;
  recipe_name: string;
  raw_material_type?: string;
  polyurethane_gram?: number;
  iso_gram?: number;
  memory_gram?: number;
  eva_gram?: number;
  sponge_gram?: number;
  xpe_gram?: number;
  fabric_type?: string;
  fabric_amount?: number;
  label_type?: string;
  label_description?: string;
  adhesive_material?: string;
  waste_percentage?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RawMaterial {
  id: string;
  company_id: string;
  name: string;
  unit: string;
  material_type?: string;
  color?: string;
  package_quantity?: number;
  package_quantity_unit?: string;
  width_cm?: number;
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
  machine_type?: string;
  mold_count?: number;
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
  async getProductionDashboardData(companyId: string) {
    try {
      console.log("🔍 [Service] getProductionDashboardData started for:", companyId);
      
      const fetchPromise = supabase
        .from("production_orders")
        .select(`
          *,
          products:product_id (id, name, sku),
          machines:machine_id (id, name, code)
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      // Add a 6-second timeout directly to the fetch
      const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Supabase sorgusu zaman aşımına uğradı (6s). Lütfen internet bağlantınızı veya AdBlocker ayarlarınızı kontrol edin.")), 6000));
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) {
        console.error("❌ [Service] getProductionDashboardData database error:", error);
        throw new Error(`production_orders: ${error.message}`);
      }
      return data || [];
    } catch (err: any) {
      console.error("❌ [Service] getProductionDashboardData exceptional error:", err);
      if (err.message && err.message.includes("production_orders")) throw err;
      throw new Error(`${err.message || "Bilinmeyen hata"}`);
    }
  },

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

    if (error) {
      console.error("production_orders query error:", error);
      throw new Error(`production_orders: ${error.message}`);
    }
    return data || [];
  },

  async getProducts(companyId: string) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("company_id", companyId);

    if (error) {
      console.error("products query error:", error);
      throw new Error(`products: ${error.message}`);
    }
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

    if (error) {
      console.error("product_recipes query error:", error);
      throw new Error(`product_recipes: ${error.message}`);
    }
    return data || [];
  },

  async getRawMaterials(companyId: string) {
    const { data, error } = await supabase
      .from("raw_materials")
      .select("*")
      .eq("company_id", companyId);

    if (error) {
      console.error("raw_materials query error:", error);
      throw new Error(`raw_materials: ${error.message}`);
    }
    return data || [];
  },

  async getMachines(companyId: string) {
    const { data, error } = await supabase
      .from("machines")
      .select("*")
      .eq("company_id", companyId);

    if (error) {
      console.error("machines query error:", error);
      throw new Error(`machines: ${error.message}`);
    }
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

    if (error) {
      console.error("purchase_requests query error:", error);
      throw new Error(`purchase_requests: ${error.message}`);
    }
    return data || [];
  },

  // --- MUTATIONS ---
  async createRawMaterial(material: Partial<RawMaterial>) {
    const { data, error } = await supabase.from("raw_materials").insert([material]).select();
    if (error) throw new Error(`raw_materials: ${error.message}`);
    return data?.[0];
  },
  async updateRawMaterial(id: string, updates: Partial<RawMaterial>) {
    const { error } = await supabase.from("raw_materials").update(updates).eq("id", id);
    if (error) throw new Error(`raw_materials: ${error.message}`);
  },
  async deleteRawMaterial(id: string) {
    const { error } = await supabase.from("raw_materials").delete().eq("id", id);
    if (error) throw new Error(`raw_materials: ${error.message}`);
  },

  async createMachine(machine: Partial<Machine>) {
    const { data, error } = await supabase.from("machines").insert([machine]).select();
    if (error) throw new Error(`machines: ${error.message}`);
    return data?.[0];
  },
  async updateMachine(id: string, updates: Partial<Machine>) {
    const { error } = await supabase.from("machines").update(updates).eq("id", id);
    if (error) throw new Error(`machines: ${error.message}`);
  },
  async deleteMachine(id: string) {
    const { error } = await supabase.from("machines").delete().eq("id", id);
    if (error) throw new Error(`machines: ${error.message}`);
  },

  async createProduct(product: Partial<Product>) {
    const { data, error } = await supabase.from("products").insert([product]).select();
    if (error) throw new Error(`products: ${error.message}`);
    return data?.[0];
  },
  async updateProduct(id: string, updates: Partial<Product>) {
    const { error } = await supabase.from("products").update(updates).eq("id", id);
    if (error) throw new Error(`products: ${error.message}`);
  },
  async deleteProduct(id: string) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw new Error(`products: ${error.message}`);
  },

  async createProductRecipe(recipe: any) {
    const { data, error } = await supabase.from("product_recipes").insert([recipe]).select();
    if (error) throw new Error(`product_recipes: ${error.message}`);
    return data?.[0];
  },
  async deleteProductRecipe(id: string) {
    const { error } = await supabase.from("product_recipes").delete().eq("id", id);
    if (error) throw new Error(`product_recipes: ${error.message}`);
  },
  async getProductionRecipes() {
    const { data, error } = await supabase
      .from("production_recipes")
      .select("id, product_id, recipe_name, raw_material_type, polyurethane_gram, iso_gram, fabric_type, label_type, waste_percentage, notes, created_at");

    if (error) {
      console.error("production_recipes query error code:", error.code);
      console.error("production_recipes query error message:", error.message);
      throw new Error(`production_recipes: ${error.message}`);
    }
    return data || [];
  },

  async createStandaloneRecipe(recipe: Partial<ProductionRecipe>) {
    const { data, error } = await supabase.from("production_recipes").insert([recipe]).select();
    if (error) throw new Error(`production_recipes: ${error.message}`);
    return data?.[0];
  },

  async updateStandaloneRecipe(id: string, updates: Partial<ProductionRecipe>) {
    const { error } = await supabase.from("production_recipes").update(updates).eq("id", id);
    if (error) throw new Error(`production_recipes: ${error.message}`);
  },

  async deleteStandaloneRecipe(id: string) {
    const { error } = await supabase.from("production_recipes").delete().eq("id", id);
    if (error) throw new Error(`production_recipes: ${error.message}`);
  },
  async updatePurchaseRequestStatus(id: string, status: string) {
    const { error } = await supabase.from("purchase_requests").update({ status }).eq("id", id);
    if (error) throw new Error(`purchase_requests: ${error.message}`);
  },
  async deletePurchaseRequest(id: string) {
    const { error } = await supabase.from("purchase_requests").delete().eq("id", id);
    if (error) throw new Error(`purchase_requests: ${error.message}`);
  },

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
