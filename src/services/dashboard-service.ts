import { supabase } from "@/lib/supabase";
import { 
  startOfMonth, 
  endOfMonth, 
  format, 
  subMonths, 
  startOfDay, 
  isBefore, 
  parseISO,
  addDays
} from "date-fns";
import { tr } from "date-fns/locale";

export interface DashboardStats {
  income: number;
  expense: number;
  net: number;
  delayedTasks: number;
  totalBankAssets: number;
  partnerReceivables: number;
  partnerPayables: number;
}

export interface BankBalance {
  id: string;
  banka_adi: string;
  hesap_adi: string;
  currentBalance: number;
  company_name?: string;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface PerformanceData {
  ay: string;
  gelir: number;
  gider: number;
}

export class DashboardService {
  static async getUpcomingExpenses(companyId?: string | "ALL", limit: number = 5) {
    try {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const nextWeekStr = format(addDays(new Date(), 7), "yyyy-MM-dd");

      let query = supabase
        .from("finance_records")
        .select("id, type, category, amount, date, status, description, company_id")
        .eq("type", "gider")
        .neq("status", "Ödendi")
        .gte("date", todayStr)
        .lte("date", nextWeekStr)
        .order("date", { ascending: true })
        .limit(limit);

      if (companyId && companyId !== "ALL") {
        query = query.or(`company_id.eq.${companyId},company_id.is.null`);
      }

      const { data, error } = await query;

      if (error) {
        const errMsg = error.message || JSON.stringify(error, Object.getOwnPropertyNames(error)) || String(error);
        console.error("⬇️ UPCOMING EXPENSES FETCH ERROR:", errMsg, "| code:", error.code, "| hint:", error.hint);
        return [];
      }

      return data || [];
    } catch (err: any) {
      console.error("⬇️ UPCOMING EXPENSES EXCEPTION:", err?.message ?? err);
      return [];
    }
  }

  static async getUpcomingIncomes(companyId?: string | "ALL", limit: number = 5) {
    try {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const nextWeekStr = format(addDays(new Date(), 7), "yyyy-MM-dd");

      console.log("⬆️ UpcomingIncomes: Sorgu başlıyor...", { companyId, todayStr, nextWeekStr });

      let query = supabase
        .from("finance_records")
        .select("id, type, category, amount, date, status, description, company_id")
        .eq("type", "gelir")
        .neq("status", "Tahsil Edildi")
        .gte("date", todayStr)
        .lte("date", nextWeekStr)
        .order("date", { ascending: true })
        .limit(limit);

      if (companyId && companyId !== "ALL") {
        query = query.or(`company_id.eq.${companyId},company_id.is.null`);
      }

      const { data, error } = await query;

      if (error) {
        const errMsg = error.message || JSON.stringify(error, Object.getOwnPropertyNames(error)) || String(error);
        console.error("⬆️ UPCOMING INCOMES FETCH ERROR:", errMsg, "| code:", error.code, "| hint:", error.hint);
        return [];
      }

      console.log("⬆️ UpcomingIncomes: Başarılı, kayıt sayısı:", data?.length ?? 0);
      return data || [];
    } catch (err: any) {
      console.error("⬆️ UPCOMING INCOMES EXCEPTION:", err?.message ?? err);
      return [];
    }
  }

  /**
   * Dashboard için tüm verileri tek bir seferde veya paralel olarak çeker.
   */
  static async getDashboardData(companyId?: string | "ALL", dateRange?: { startDate: Date, endDate: Date }) {
    const now = new Date();
    const filterStart = dateRange ? format(dateRange.startDate, "yyyy-MM-dd") : format(startOfMonth(now), "yyyy-MM-dd");
    const filterEnd = dateRange ? format(dateRange.endDate, "yyyy-MM-dd") : format(endOfMonth(now), "yyyy-MM-dd");
    const todayStr = format(now, "yyyy-MM-dd");

    try {
      console.log(`🚀 Dashboard verileri çekiliyor... (${companyId || "Tüm Şirketler"}) | Range: ${filterStart} - ${filterEnd}`);

      // 1. Paralel Sorgular
      // Performans grafiği için son 12 ayı kapsamalıyız
      const twelveMonthsAgo = format(subMonths(now, 11), "yyyy-MM-01");
      
      // Grafik ve Dağılım için kısıtlı sorgu - sadece garanti kolonlar
      let performanceQuery = supabase
        .from("finance_records")
        .select(`
          *,
          finance_categories (
            id,
            name
          )
        `)
        .gte("date", twelveMonthsAgo)
        .order("date", { ascending: false });

      // Banka bakiyeleri için tüm geçmişi kapsayan ama sadece gerekli kolonları alan sorgu
      let bankBalanceRecordsQuery = supabase
        .from("finance_records")
        .select("amount, type, banka_id, status")
        .neq("status", "İptal Edildi");

      let banksQuery = supabase.from("banks").select("*, companies(company_name)").eq("aktif_mi", true);
      let tasksQuery = supabase.from("tasks").select("*").neq("status", "Tamamlandı");
      let partnersQuery = supabase.from("partner_transactions").select("*");

      if (companyId && companyId !== "ALL") {
        performanceQuery = performanceQuery.or(`company_id.eq.${companyId},company_id.is.null`);
        bankBalanceRecordsQuery = bankBalanceRecordsQuery.or(`company_id.eq.${companyId},company_id.is.null`);
        banksQuery = banksQuery.or(`company_id.eq.${companyId},company_id.is.null`);
        tasksQuery = tasksQuery.eq("company_id", companyId);
        partnersQuery = partnersQuery.eq("company_id", companyId);
      }

      console.log("📡 DashboardService: Tüm sorgular paralel (Promise.all) başlıyor...");
      
      const startTime = Date.now();

      const [
        performanceRes,
        bankBalanceRes,
        banksRes,
        tasksRes,
        partnersRes,
        upcomingPayments,
        upcomingCollections
      ] = await Promise.all([
        performanceQuery,
        bankBalanceRecordsQuery,
        banksQuery,
        tasksQuery,
        partnersQuery,
        DashboardService.getUpcomingExpenses(companyId).catch(err => { console.error("UpcomingExpenses Error:", err); return []; }),
        DashboardService.getUpcomingIncomes(companyId).catch(err => { console.error("UpcomingIncomes Error:", err); return []; })
      ]);

      const duration = Date.now() - startTime;
      console.log(`⏱️ DashboardService: Tüm sorgular bitti (${duration}ms)`);

      // 2. Individual Error Checks with Detailed Logging
      if (performanceRes.error) {
        console.error("📊 PERFORMANCE FETCH ERROR:", performanceRes.error.message);
      }
      
      if (bankBalanceRes.error) {
        console.error("💰 BANK BALANCE FETCH ERROR:", bankBalanceRes.error.message);
      }

      if (banksRes.error) {
        console.error("🏦 BANKS FETCH ERROR:", banksRes.error.message);
      }

      if (tasksRes.error) {
        console.error("📝 TASKS FETCH ERROR:", tasksRes.error.message);
      }

      // Safe Data Access
      const performanceRecords = performanceRes.data || [];
      const balanceRecords = bankBalanceRes.data || [];
      const banks = banksRes.data || [];
      const tasks = tasksRes.data || [];
      const partnerTransactions = partnersRes.data || [];

      // 3. Banka Bakiyelerini Hesapla (Null-Safe)
      const processedBanks: BankBalance[] = banks.map(bank => {
        const bankRecords = balanceRecords.filter(r => r.banka_id === bank.id);
        
        let realizedIncome = 0;
        let realizedExpense = 0;

        bankRecords.forEach(r => {
          if (r.status === "İptal Edildi") return;
          const amt = Math.abs(Number(r.amount) || 0);
          const type = String(r.type || "").toLowerCase();

          if (type === "gelir" || type === "income" || type === "deposit") {
            realizedIncome += amt;
          } else if (type === "gider" || type === "expense" || type === "withdrawal" || type === "outgoing") {
            realizedExpense += amt;
          }
        });
        
        return {
          id: bank.id,
          banka_adi: bank.banka_adi,
          hesap_adi: bank.hesap_adi,
          currentBalance: Number(bank.baslangic_bakiyesi || 0) + realizedIncome - realizedExpense,
          company_name: bank.companies?.company_name
        };
      });

      const totalBankAssets = processedBanks.reduce((sum, b) => sum + b.currentBalance, 0);

      // 4. KPI (Seçili Dönem) Hesapla
      const currentPeriodRecords = performanceRecords.filter(r => {
        return r.date >= filterStart && r.date <= filterEnd;
      });

      const income = currentPeriodRecords
        .filter(r => (r.type === "gelir" || r.type === "income") && r.status === "Tahsil Edildi" && !r.partner_id)
        .reduce((sum, r) => sum + Number(r.amount), 0);
      
      const expense = currentPeriodRecords
        .filter(r => (r.type === "gider" || r.type === "expense") && r.status === "Ödendi" && !r.partner_id)
        .reduce((sum, r) => sum + Number(r.amount), 0);

      // 5. Gecikmiş Görevler
      const delayedTasksList = tasks.filter(t => {
        if (!t.due_date) return false;
        const taskDate = format(parseISO(t.due_date), "yyyy-MM-dd");
        return taskDate < todayStr;
      });

      // 6. Dağılım Verileri (Pie Chart) - Ortak Cari hariç (partner_id ile)
      const incomeDist = this.aggregateByCategory(currentPeriodRecords.filter(r => (r.type === "gelir" || r.type === "income") && r.status === "Tahsil Edildi" && !r.partner_id));
      const expenseDist = this.aggregateByCategory(currentPeriodRecords.filter(r => (r.type === "gider" || r.type === "expense") && r.status === "Ödendi" && !r.partner_id));

      // 7. Aylık Performans (Son 6 Ay) - Ortak Cari hariç (partner_id ile)
      const performance = this.calculateMonthlyPerformance(performanceRecords.filter(r => !r.partner_id));

      // 8. Operasyonel Listeler
      const todayTasks = tasks.filter(t => t.due_date && format(parseISO(t.due_date), "yyyy-MM-dd") === todayStr);
      
      // 9. Ortak Cari Hesapları Hesapla
      const pBalances: Record<string, number> = {};
      partnerTransactions.forEach(t => {
        if (!pBalances[t.partner_id]) pBalances[t.partner_id] = 0;
        if (t.type === "deposit") pBalances[t.partner_id] -= Number(t.amount);
        else pBalances[t.partner_id] += Number(t.amount);
      });

      const partnerReceivables = Object.values(pBalances).filter(b => b > 0).reduce((sum, b) => sum + b, 0);
      const partnerPayables = Object.values(pBalances).filter(b => b < 0).reduce((sum, b) => sum + Math.abs(b), 0);

      return {
        stats: {
          income,
          expense,
          net: income - expense,
          delayedTasks: delayedTasksList.length,
          totalBankAssets,
          partnerReceivables,
          partnerPayables
        },
        banks: processedBanks,
        charts: {
          incomeDist,
          expenseDist,
          performance
        },
        operational: {
          todayTasks,
          delayedTasks: delayedTasksList.slice(0, 5),
          upcomingPayments,
          upcomingCollections
        }
      };

    } catch (err: any) {
      console.error("CRITICAL DashboardService Error:", err.message);
      // Return empty dashboard structure to prevent UI crash
      return {
        stats: { income: 0, expense: 0, net: 0, delayedTasks: 0, totalBankAssets: 0 },
        banks: [],
        charts: { incomeDist: [], expenseDist: [], performance: [] },
        operational: { todayTasks: [], delayedTasks: [], upcomingPayments: [], upcomingCollections: [] }
      };
    }
  }

  private static aggregateByCategory(records: any[]): ChartData[] {
    const counts = records.reduce((acc, curr) => {
      // Hiyerarşik isim belirleme
      const categoryName = 
        (curr.category && typeof curr.category === 'object' && curr.category.name) ||
        curr.finance_categories?.name || 
        curr.category_name || 
        (curr.category && typeof curr.category === 'string' && curr.category) || 
        "Kategorisiz";
      
      // Ortak Cari kayıtlarını hariç tut (partner_id veya kategori adında "Ortak" geçiyorsa)
      if (curr.partner_id || categoryName.toLowerCase().includes("ortak")) {
        return acc;
      }
      
      acc[categoryName] = (acc[categoryName] || 0) + Number(curr.amount);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value);
  }

  private static calculateMonthlyPerformance(records: any[]): PerformanceData[] {
    const now = new Date();
    // Son 6 ayı al (mevcut ay dahil)
    const months = Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i));
    
    return months.map(m => {
      const monthStr = format(m, "yyyy-MM");
      const monthLabel = format(m, "MMM", { locale: tr });
      
      const monthRecords = records.filter(r => r.date && r.date.startsWith(monthStr));
      
      const gelir = monthRecords
        .filter(r => (r.type === "gelir" || r.type === "income") && r.status === "Tahsil Edildi")
        .reduce((s, r) => s + Number(r.amount), 0);
        
      const gider = monthRecords
        .filter(r => (r.type === "gider" || r.type === "expense") && r.status === "Ödendi")
        .reduce((s, r) => s + Number(r.amount), 0);
      
      return {
        ay: monthLabel,
        gelir: Math.round(gelir / 1000), // k₺ cinsinden gösterim için 1000'e bölüyoruz
        gider: Math.round(gider / 1000)
      };
    });
  }
}
