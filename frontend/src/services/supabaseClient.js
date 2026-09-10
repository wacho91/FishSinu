import { createClient } from '@supabase/supabase-js'

// Tu URL de Supabase (ya la conocemos por el Project ID)
const supabaseUrl = 'https://xsfdufxevnddztvkqwxc.supabase.co'

// La Publishable Key que acabas de copiar
const supabaseAnonKey = 'sb_publishable_n68X-TAmsDPOdT9UG7y-Hw_sPtn0WES'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)