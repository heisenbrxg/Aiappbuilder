import { createClient } from '../supabase/client';

export interface UserSetting {
  id: string;
  user_id: string;
  category: string;
  key: string;
  value: any;
  synced: boolean;
  created_at: string;
  updated_at: string;
}

export class SupabaseSettings {
  private supabase = createClient();

  async getSetting(userId: string, category: string, key: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('user_settings')
      .select('value')
      .eq('user_id', userId)
      .eq('category', category)
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      throw new Error(`Failed to get setting: ${error.message}`);
    }

    return data?.value;
  }

  async setSetting(userId: string, category: string, key: string, value: any, synced: boolean = true): Promise<void> {
    const { error } = await this.supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        category,
        key,
        value,
        synced,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to set setting: ${error.message}`);
    }
  }

  async getAllSettings(userId: string): Promise<Record<string, any>> {
    const { data, error } = await this.supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to get settings: ${error.message}`);
    }

    const settings: Record<string, any> = {};
    data?.forEach((setting: any) => {
      const key = `${setting.category}_${setting.key}`;
      settings[key] = setting.value;
    });

    return settings;
  }

  async getSettingsByCategory(userId: string, category: string): Promise<Record<string, any>> {
    const { data, error } = await this.supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category);

    if (error) {
      throw new Error(`Failed to get settings: ${error.message}`);
    }

    const settings: Record<string, any> = {};
    data?.forEach((setting: any) => {
      settings[setting.key] = setting.value;
    });

    return settings;
  }

  async deleteSetting(userId: string, category: string, key: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_settings')
      .delete()
      .eq('user_id', userId)
      .eq('category', category)
      .eq('key', key);

    if (error) {
      throw new Error(`Failed to delete setting: ${error.message}`);
    }
  }

  async syncLocalToSupabase(userId: string, localSettings: Record<string, any>): Promise<void> {
    const settingsToInsert = [];

    for (const [key, value] of Object.entries(localSettings)) {
      // Categorize settings
      let category = 'ui';
      if (key.includes('developer') || key.includes('event') || key.includes('debug')) {
        category = 'developer';
      } else if (key.includes('template') || key.includes('optimization') || key.includes('prompt')) {
        category = 'features';
      } else if (key.includes('theme') || key.includes('language')) {
        category = 'appearance';
      }

      settingsToInsert.push({
        user_id: userId,
        category,
        key,
        value,
        synced: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    if (settingsToInsert.length > 0) {
      const { error } = await this.supabase
        .from('user_settings')
        .upsert(settingsToInsert);

      if (error) {
        throw new Error(`Failed to sync settings: ${error.message}`);
      }
    }
  }

  async loadSettingsToLocal(userId: string): Promise<Record<string, any>> {
    const settings = await this.getAllSettings(userId);
    
    // Apply settings to localStorage
    if (typeof window !== 'undefined') {
      for (const [key, value] of Object.entries(settings)) {
        try {
          localStorage.setItem(key.replace('_', ''), JSON.stringify(value));
        } catch (error) {
          console.warn(`Failed to set localStorage item ${key}:`, error);
        }
      }
    }

    return settings;
  }
}
