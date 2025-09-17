// All the data your prototype needs in one simple file
// Edit this file to change what appears in tables and cards

// Import comprehensive data from JSON files
import athletesData from './data/athletes.json'
import injuriesData from './data/injuries_medical.json'
import trainingsData from './data/training_sessions.json'
import assessmentsData from './data/assessments.json'
import gamesData from './data/games_matches.json'
import squadsData from './data/squads_teams.json'
import questionnairesData from './data/questionnaires_wellbeing.json'
import staffData from './data/users_staff.json'

// Export all data for easy access
export const athletes = athletesData
export const injuries = injuriesData
export const training = trainingsData
export const assessments = assessmentsData
export const games = gamesData
export const squads = squadsData
export const questionnaires = questionnairesData
export const staff = staffData

// Simple data extracts for backward compatibility and easy access
export const athletesSimple = athletes.map(athlete => ({
  id: athlete.id,
  name: `${athlete.firstname} ${athlete.lastname}`,
  position: athlete.position,
  age: athlete.age,
  status: athlete.availability_status,
  team: athlete.squad_name,
  nationality: athlete.country,
  height: athlete.height,
  weight: athlete.weight,
  performance: athlete.performance_score,
  value: athlete.market_value
}))

export const trainingSimple = training.map(session => ({
  id: session.id,
  date: session.date,
  type: session.session_type,
  duration: `${session.duration} min`,
  intensity: session.intensity,
  status: session.status,
  attendance: session.attendance,
  total: session.max_attendance
}))

export const assessmentsSimple = assessments.map(assessment => ({
  id: assessment.id,
  athlete: assessment.athlete_name,
  type: assessment.assessment_type,
  date: assessment.assessment_date,
  score: assessment.overall_score,
  status: assessment.status
}))