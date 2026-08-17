export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      body_measurements: {
        Row: {
          diastolic_blood_pressure: number | null
          id: string
          pulse_bpm: number | null
          systolic_blood_pressure: number | null
          temperature_celsius: number | null
          weight_kg: number | null
        }
        Insert: {
          diastolic_blood_pressure?: number | null
          id: string
          pulse_bpm?: number | null
          systolic_blood_pressure?: number | null
          temperature_celsius?: number | null
          weight_kg?: number | null
        }
        Update: {
          diastolic_blood_pressure?: number | null
          id?: string
          pulse_bpm?: number | null
          systolic_blood_pressure?: number | null
          temperature_celsius?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "body_measurements_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "tracking_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_notes: {
        Row: {
          created_at: string
          date: string
          id: string
          note: string | null
          stress_level: number | null
          updated_at: string
          user_id: string
          wellbeing: number | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          note?: string | null
          stress_level?: number | null
          updated_at?: string
          user_id: string
          wellbeing?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          stress_level?: number | null
          updated_at?: string
          user_id?: string
          wellbeing?: number | null
        }
        Relationships: []
      }
      drink_entries: {
        Row: {
          alcohol_percent: number | null
          amount_ml: number | null
          caffeine_mg: number | null
          drink_name: string
          id: string
        }
        Insert: {
          alcohol_percent?: number | null
          amount_ml?: number | null
          caffeine_mg?: number | null
          drink_name: string
          id: string
        }
        Update: {
          alcohol_percent?: number | null
          amount_ml?: number | null
          caffeine_mg?: number | null
          drink_name?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drink_entries_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "tracking_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      food_entries: {
        Row: {
          description: string | null
          fatty_level: number | null
          id: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          spicy_level: number | null
        }
        Insert: {
          description?: string | null
          fatty_level?: number | null
          id: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          spicy_level?: number | null
        }
        Update: {
          description?: string | null
          fatty_level?: number | null
          id?: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          spicy_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "food_entries_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "tracking_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      food_entry_items: {
        Row: {
          amount: number | null
          created_at: string
          custom_name: string | null
          food_entry_id: string
          food_id: string | null
          id: string
          unit: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          custom_name?: string | null
          food_entry_id: string
          food_id?: string | null
          id?: string
          unit?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          custom_name?: string | null
          food_entry_id?: string
          food_id?: string | null
          id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_entry_items_food_entry_id_fkey"
            columns: ["food_entry_id"]
            isOneToOne: false
            referencedRelation: "food_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_entry_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          brand: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      medication_entries: {
        Row: {
          dose: number | null
          dose_unit: string | null
          id: string
          medication_id: string
          medication_schedule_id: string | null
          taken_as_needed: boolean
        }
        Insert: {
          dose?: number | null
          dose_unit?: string | null
          id: string
          medication_id: string
          medication_schedule_id?: string | null
          taken_as_needed?: boolean
        }
        Update: {
          dose?: number | null
          dose_unit?: string | null
          id?: string
          medication_id?: string
          medication_schedule_id?: string | null
          taken_as_needed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "medication_entries_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "tracking_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_entries_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_entries_medication_schedule_id_fkey"
            columns: ["medication_schedule_id"]
            isOneToOne: false
            referencedRelation: "medication_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_schedules: {
        Row: {
          created_at: string
          dose: number | null
          dose_unit: string | null
          id: string
          is_active: boolean
          medication_id: string
          schedule_type: Database["public"]["Enums"]["medication_schedule_type"]
          scheduled_time: string | null
          updated_at: string
          user_id: string
          valid_from: string | null
          valid_until: string | null
          weekdays: number[] | null
        }
        Insert: {
          created_at?: string
          dose?: number | null
          dose_unit?: string | null
          id?: string
          is_active?: boolean
          medication_id: string
          schedule_type?: Database["public"]["Enums"]["medication_schedule_type"]
          scheduled_time?: string | null
          updated_at?: string
          user_id: string
          valid_from?: string | null
          valid_until?: string | null
          weekdays?: number[] | null
        }
        Update: {
          created_at?: string
          dose?: number | null
          dose_unit?: string | null
          id?: string
          is_active?: boolean
          medication_id?: string
          schedule_type?: Database["public"]["Enums"]["medication_schedule_type"]
          scheduled_time?: string | null
          updated_at?: string
          user_id?: string
          valid_from?: string | null
          valid_until?: string | null
          weekdays?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "medication_schedules_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          active_ingredient: string | null
          created_at: string
          default_dose: number | null
          default_dose_unit: string | null
          form: Database["public"]["Enums"]["medication_form"]
          id: string
          is_active: boolean
          name: string
          notes: string | null
          strength: number | null
          strength_unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_ingredient?: string | null
          created_at?: string
          default_dose?: number | null
          default_dose_unit?: string | null
          form?: Database["public"]["Enums"]["medication_form"]
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          strength?: number | null
          strength_unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_ingredient?: string | null
          created_at?: string
          default_dose?: number | null
          default_dose_unit?: string | null
          form?: Database["public"]["Enums"]["medication_form"]
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          strength?: number | null
          strength_unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birth_date: string | null
          created_at: string
          current_weight_kg: number | null
          first_name: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          height_cm: number | null
          id: string
          last_name: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          current_weight_kg?: number | null
          first_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          height_cm?: number | null
          id: string
          last_name?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          current_weight_kg?: number | null
          first_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          height_cm?: number | null
          id?: string
          last_name?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      sleep_entries: {
        Row: {
          id: string
          interruptions: number | null
          quality: number | null
          sleep_ended_at: string | null
          sleep_started_at: string
        }
        Insert: {
          id: string
          interruptions?: number | null
          quality?: number | null
          sleep_ended_at?: string | null
          sleep_started_at: string
        }
        Update: {
          id?: string
          interruptions?: number | null
          quality?: number | null
          sleep_ended_at?: string | null
          sleep_started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sleep_entries_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "tracking_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      stool_entries: {
        Row: {
          amount: Database["public"]["Enums"]["stool_amount"] | null
          blood: boolean
          bristol_scale: number | null
          color: string | null
          complete_evacuation: boolean | null
          consistency: Database["public"]["Enums"]["stool_consistency"]
          id: string
          mucus: boolean
          pain_level: number | null
          unusual_smell: boolean | null
          urgency: number | null
        }
        Insert: {
          amount?: Database["public"]["Enums"]["stool_amount"] | null
          blood?: boolean
          bristol_scale?: number | null
          color?: string | null
          complete_evacuation?: boolean | null
          consistency: Database["public"]["Enums"]["stool_consistency"]
          id: string
          mucus?: boolean
          pain_level?: number | null
          unusual_smell?: boolean | null
          urgency?: number | null
        }
        Update: {
          amount?: Database["public"]["Enums"]["stool_amount"] | null
          blood?: boolean
          bristol_scale?: number | null
          color?: string | null
          complete_evacuation?: boolean | null
          consistency?: Database["public"]["Enums"]["stool_consistency"]
          id?: string
          mucus?: boolean
          pain_level?: number | null
          unusual_smell?: boolean | null
          urgency?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stool_entries_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "tracking_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      symptom_entries: {
        Row: {
          body_area: string | null
          custom_name: string | null
          duration_minutes: number | null
          id: string
          severity: number
          symptom_id: string | null
        }
        Insert: {
          body_area?: string | null
          custom_name?: string | null
          duration_minutes?: number | null
          id: string
          severity: number
          symptom_id?: string | null
        }
        Update: {
          body_area?: string | null
          custom_name?: string | null
          duration_minutes?: number | null
          id?: string
          severity?: number
          symptom_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "symptom_entries_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "tracking_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "symptom_entries_symptom_id_fkey"
            columns: ["symptom_id"]
            isOneToOne: false
            referencedRelation: "symptoms"
            referencedColumns: ["id"]
          },
        ]
      }
      symptoms: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      tracking_entries: {
        Row: {
          created_at: string
          entry_type: Database["public"]["Enums"]["tracking_entry_type"]
          id: string
          note: string | null
          occurred_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_type: Database["public"]["Enums"]["tracking_entry_type"]
          id?: string
          note?: string | null
          occurred_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_type?: Database["public"]["Enums"]["tracking_entry_type"]
          id?: string
          note?: string | null
          occurred_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tracking_entry_tags: {
        Row: {
          tag_id: string
          tracking_entry_id: string
        }
        Insert: {
          tag_id: string
          tracking_entry_id: string
        }
        Update: {
          tag_id?: string
          tracking_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_entry_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_entry_tags_tracking_entry_id_fkey"
            columns: ["tracking_entry_id"]
            isOneToOne: false
            referencedRelation: "tracking_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      urination_entries: {
        Row: {
          amount: Database["public"]["Enums"]["urine_amount"] | null
          burning: boolean
          color: string | null
          id: string
          nighttime: boolean
          pain_level: number | null
          urgency: number | null
        }
        Insert: {
          amount?: Database["public"]["Enums"]["urine_amount"] | null
          burning?: boolean
          color?: string | null
          id: string
          nighttime?: boolean
          pain_level?: number | null
          urgency?: number | null
        }
        Update: {
          amount?: Database["public"]["Enums"]["urine_amount"] | null
          burning?: boolean
          color?: string | null
          id?: string
          nighttime?: boolean
          pain_level?: number | null
          urgency?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "urination_entries_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "tracking_entries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      gender_type: "MALE" | "FEMALE"
      meal_type: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "OTHER"
      medication_form:
        | "TABLET"
        | "CAPSULE"
        | "DROPS"
        | "LIQUID"
        | "POWDER"
        | "SPRAY"
        | "INJECTION"
        | "SUPPOSITORY"
        | "OTHER"
      medication_schedule_type: "SCHEDULED" | "AS_NEEDED"
      stool_amount: "SMALL" | "MEDIUM" | "LARGE"
      stool_consistency:
        | "WATERY_DIARRHEA"
        | "DIARRHEA"
        | "SOFT"
        | "NORMAL"
        | "HARD"
        | "VERY_HARD"
      tracking_entry_type:
        | "FOOD"
        | "DRINK"
        | "MEDICATION"
        | "STOOL"
        | "URINATION"
        | "SYMPTOM"
        | "BODY_MEASUREMENT"
        | "SLEEP"
        | "OTHER"
      urine_amount: "SMALL" | "MEDIUM" | "LARGE"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      gender_type: ["MALE", "FEMALE"],
      meal_type: ["BREAKFAST", "LUNCH", "DINNER", "SNACK", "OTHER"],
      medication_form: [
        "TABLET",
        "CAPSULE",
        "DROPS",
        "LIQUID",
        "POWDER",
        "SPRAY",
        "INJECTION",
        "SUPPOSITORY",
        "OTHER",
      ],
      medication_schedule_type: ["SCHEDULED", "AS_NEEDED"],
      stool_amount: ["SMALL", "MEDIUM", "LARGE"],
      stool_consistency: [
        "WATERY_DIARRHEA",
        "DIARRHEA",
        "SOFT",
        "NORMAL",
        "HARD",
        "VERY_HARD",
      ],
      tracking_entry_type: [
        "FOOD",
        "DRINK",
        "MEDICATION",
        "STOOL",
        "URINATION",
        "SYMPTOM",
        "BODY_MEASUREMENT",
        "SLEEP",
        "OTHER",
      ],
      urine_amount: ["SMALL", "MEDIUM", "LARGE"],
    },
  },
} as const
