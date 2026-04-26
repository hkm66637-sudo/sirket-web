-- FULL SYSTEM RLS STABILIZATION MIGRATION
-- This migration drops ALL potentially recursive policies and replaces them with 
-- flat, non-recursive policies relying on JWT metadata and SECURITY DEFINER functions.

-- =========================================================================
-- 1. UTILITY FUNCTION
-- =========================================================================
-- Ensure get_my_profile_data exists and is SECURITY DEFINER (bypasses RLS)
-- Drop dependent policies first to avoid CASCADE requirement
DROP POLICY IF EXISTS "Profiles access policy" ON public.profiles;
DROP POLICY IF EXISTS "Admin and Operasyon can manage tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admin and Finans can manage finance records" ON public.finance_records;

-- Drop newly created policies from previous run to allow dropping the function
DROP POLICY IF EXISTS "Finance Select Policy" ON public.finance_records;
DROP POLICY IF EXISTS "Finance Insert Policy" ON public.finance_records;
DROP POLICY IF EXISTS "Finance Update Policy" ON public.finance_records;
DROP POLICY IF EXISTS "Banks Select Policy" ON public.banks;
DROP POLICY IF EXISTS "Banks Management Policy" ON public.banks;
DROP POLICY IF EXISTS "Tasks Select Policy" ON public.tasks;

DROP FUNCTION IF EXISTS public.get_my_profile_data() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_profile_data();
CREATE OR REPLACE FUNCTION public.get_my_profile_data()
RETURNS json AS $$
DECLARE
  profile_data json;
BEGIN
  SELECT row_to_json(p) INTO profile_data
  FROM public.profiles p
  WHERE p.id = auth.uid();
  
  RETURN profile_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- 2. PROFILES TABLE POLICIES (CORE FIX)
-- =========================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin and Super Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;
DROP POLICY IF EXISTS "Admin and Finans can manage finance records" ON public.profiles;

-- New Profiles Policies
DROP POLICY IF EXISTS "Profiles Select Policy" ON public.profiles;
CREATE POLICY "Profiles Select Policy" ON public.profiles
FOR SELECT USING (
    id = auth.uid() 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin')
);

DROP POLICY IF EXISTS "Profiles Update Policy" ON public.profiles;
CREATE POLICY "Profiles Update Policy" ON public.profiles
FOR UPDATE USING (
    id = auth.uid() 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin')
) WITH CHECK (
    id = auth.uid() 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin')
);

DROP POLICY IF EXISTS "Profiles Insert Policy" ON public.profiles;
CREATE POLICY "Profiles Insert Policy" ON public.profiles
FOR INSERT WITH CHECK (
    id = auth.uid() -- Allow self signup via trigger
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin') -- Allow admins to create
);

-- =========================================================================
-- 3. FINANCE_RECORDS POLICIES
-- =========================================================================
DROP POLICY IF EXISTS "Admin and Finans can manage finance records" ON public.finance_records;
DROP POLICY IF EXISTS "Users can view finance records" ON public.finance_records;

CREATE POLICY "Finance Select Policy" ON public.finance_records
FOR SELECT USING (
    -- 1. Management Roles (Admin, Finans, Muhasebe) see all records
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin', 'finans', 'muhasebe_muduru')
    OR (public.get_my_profile_data() ->> 'role') IN ('super_admin', 'admin', 'finans', 'muhasebe_muduru')
    OR (public.get_my_profile_data() ->> 'access_scope') = 'global'
    
    -- 2. Company limited users see their own company + shared global records (company_id is null)
    OR (
        (public.get_my_profile_data() ->> 'access_scope') = 'company_only' 
        AND (
            company_id = (public.get_my_profile_data() ->> 'company_id')::uuid
            OR company_id IS NULL
        )
    )
    
    -- 3. Self only users see their own records
    OR created_by = auth.uid()
);

CREATE POLICY "Finance Insert Policy" ON public.finance_records
FOR INSERT WITH CHECK (
    created_by = auth.uid()
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin', 'finans', 'muhasebe_muduru', 'muhasebe_personeli')
    OR (public.get_my_profile_data() ->> 'role') IN ('super_admin', 'admin', 'finans', 'muhasebe_muduru', 'muhasebe_personeli')
    OR (public.get_my_profile_data() ->> 'access_scope') IN ('global', 'company_only')
);

DROP POLICY IF EXISTS "Finance Update Policy" ON public.finance_records;
CREATE POLICY "Finance Update Policy" ON public.finance_records
FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin', 'finans', 'muhasebe_muduru')
    OR (public.get_my_profile_data() ->> 'role') IN ('super_admin', 'admin', 'finans', 'muhasebe_muduru')
) WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin', 'finans', 'muhasebe_muduru')
    OR (public.get_my_profile_data() ->> 'role') IN ('super_admin', 'admin', 'finans', 'muhasebe_muduru')
);

DROP POLICY IF EXISTS "Finance Delete Policy" ON public.finance_records;
CREATE POLICY "Finance Delete Policy" ON public.finance_records
FOR DELETE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin')
);

-- =========================================================================
-- 4. BANKS POLICIES
-- =========================================================================
DROP POLICY IF EXISTS "Enable read access for banks" ON public.banks;
DROP POLICY IF EXISTS "Admin and Finans can manage banks" ON public.banks;

CREATE POLICY "Banks Select Policy" ON public.banks
FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin', 'finans', 'muhasebe_muduru', 'muhasebe_personeli')
    OR (public.get_my_profile_data() ->> 'role') IN ('super_admin', 'admin', 'finans', 'muhasebe_muduru', 'muhasebe_personeli')
    OR (public.get_my_profile_data() ->> 'access_scope') = 'global'
    OR (
        (public.get_my_profile_data() ->> 'access_scope') = 'company_only' 
        AND (
            company_id = (public.get_my_profile_data() ->> 'company_id')::uuid
            OR company_id IS NULL
        )
    )
);

DROP POLICY IF EXISTS "Banks Management Policy" ON public.banks;
CREATE POLICY "Banks Management Policy" ON public.banks
FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin', 'finans', 'muhasebe_muduru')
    OR (public.get_my_profile_data() ->> 'role') IN ('super_admin', 'admin', 'finans', 'muhasebe_muduru')
) WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin', 'finans', 'muhasebe_muduru')
    OR (public.get_my_profile_data() ->> 'role') IN ('super_admin', 'admin', 'finans', 'muhasebe_muduru')
);

-- =========================================================================
-- 5. TASKS POLICIES
-- =========================================================================
DROP POLICY IF EXISTS "Role based task access" ON public.tasks;
DROP POLICY IF EXISTS "Users can view their tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON public.tasks;

CREATE POLICY "Tasks Select Policy" ON public.tasks
FOR SELECT USING (
    -- 1. Admin/Super Admin sees all
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin')
    OR (public.get_my_profile_data() ->> 'role') IN ('super_admin', 'admin')
    OR (public.get_my_profile_data() ->> 'access_scope') = 'global'
    
    -- 2. Assigned user or creator
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
    
    -- 3. Company Level (Other Managers except muhasebe_muduru)
    OR (
        (public.get_my_profile_data() ->> 'access_scope') = 'company_only'
        AND company_id = (public.get_my_profile_data() ->> 'company_id')::uuid
        -- NEW: Muhasebe Müdürü only sees their own tasks, even if company_only
        AND (public.get_my_profile_data() ->> 'role') != 'muhasebe_muduru'
    )
);

DROP POLICY IF EXISTS "Tasks Insert Policy" ON public.tasks;
CREATE POLICY "Tasks Insert Policy" ON public.tasks
FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL -- Any authenticated user can create a task
);

DROP POLICY IF EXISTS "Tasks Update Policy" ON public.tasks;
CREATE POLICY "Tasks Update Policy" ON public.tasks
FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin')
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
) WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin')
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
);

-- =========================================================================
-- 6. PUBLIC DATA POLICIES (Companies, Departments)
-- =========================================================================
-- Ensure these are readable by any authenticated user
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.companies;
CREATE POLICY "Enable read access for all authenticated users" ON public.companies
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Finance Categories
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.finance_categories;
CREATE POLICY "Enable read access for all authenticated users" ON public.finance_categories
FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Management can manage finance categories" ON public.finance_categories;
CREATE POLICY "Management can manage finance categories" ON public.finance_categories
FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin', 'finans', 'muhasebe_muduru')
) WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin', 'finans', 'muhasebe_muduru')
);

-- Category-Company Relations (Junction Table)
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.category_companies;
CREATE POLICY "Enable read access for all authenticated users" ON public.category_companies
FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Management can manage category relations" ON public.category_companies;
CREATE POLICY "Management can manage category relations" ON public.category_companies
FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin', 'finans', 'muhasebe_muduru')
) WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin', 'finans', 'muhasebe_muduru')
);
