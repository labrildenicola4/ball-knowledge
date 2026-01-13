import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface League {
  id: number;
  api_id: number;
  name: string;
  country: string;
  logo: string;
  flag: string;
}

export interface Team {
  id: number;
  api_id: number;
  name: string;
  short_name: string;
  logo: string;
  league_id: number;
}

export interface Match {
  id: number;
  api_id: number;
  league_id: number;
  home_team_id: number;
  away_team_id: number;
  home_score: number | null;
  away_score: number | null;
  status: string;
  kickoff: string;
  venue: string;
  attendance: number | null;
  updated_at: string;
}

export interface Standing {
  id: number;
  league_id: number;
  team_id: number;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  form: string;
  updated_at: string;
}

export interface MatchEvent {
  id: number;
  match_id: number;
  team_id: number;
  player_name: string;
  event_type: 'goal' | 'yellow' | 'red' | 'sub_in' | 'sub_out';
  minute: number;
  assist_name: string | null;
}

export interface Lineup {
  id: number;
  match_id: number;
  team_id: number;
  player_name: string;
  player_number: number;
  position: string;
  is_starter: boolean;
}
