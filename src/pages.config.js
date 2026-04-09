/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AccessDenied from './pages/AccessDenied';
import ActionItems from './pages/ActionItems';
import AdminFeatureRequests from './pages/AdminFeatureRequests';
import AdminThreats from './pages/AdminThreats';
import Assessment from './pages/Assessment';
import BIA from './pages/BIA';
import CompanyManagement from './pages/CompanyManagement';
import CompanyOnboarding from './pages/CompanyOnboarding';
import Dashboard from './pages/Dashboard';
import EarlyCareer from './pages/EarlyCareer';
import EducationalResources from './pages/EducationalResources';
import EtsiAssessment from './pages/EtsiAssessment';
import EtsiAssessmentsList from './pages/EtsiAssessmentsList';
import EtsiReport from './pages/EtsiReport';
import HTMLReport from './pages/HTMLReport';
import IOCAnalyzer from './pages/IOCAnalyzer';
import IncidentDetail from './pages/IncidentDetail';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import PCIScopingGuide from './pages/PCIScopingGuide';
import PendingApproval from './pages/PendingApproval';
import PolicyCenter from './pages/PolicyCenter';
import PolicyEditor from './pages/PolicyEditor';
import PolicyGenerator from './pages/PolicyGenerator';
import PolicyLibrary from './pages/PolicyLibrary';
import Pricing from './pages/Pricing';
import PricingAndFeatures from './pages/PricingAndFeatures';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ProfessionalReportView from './pages/ProfessionalReportView';
import Questionnaire from './pages/Questionnaire';
import Reports from './pages/Reports';
import RequestFeature from './pages/RequestFeature';
import ResponseReadiness from './pages/ResponseReadiness';
import SampleAssessmentReportView from './pages/SampleAssessmentReportView';
import SampleIncidentReport from './pages/SampleIncidentReport';
import SampleTabletopReport from './pages/SampleTabletopReport';
import SecurityQuestions from './pages/SecurityQuestions';
import SecurityTraining from './pages/SecurityTraining';
import SmartAnalysisSettings from './pages/SmartAnalysisSettings';
import SystemHealth from './pages/SystemHealth';
import TabletopExerciseDetail from './pages/TabletopExerciseDetail';
import TabletopExerciseDraft from './pages/TabletopExerciseDraft';
import TeamManagement from './pages/TeamManagement';
import TermsOfService from './pages/TermsOfService';
import TrainingVideoManager from './pages/TrainingVideoManager';
import TrialExpired from './pages/TrialExpired';
import UserManagement from './pages/UserManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AccessDenied": AccessDenied,
    "ActionItems": ActionItems,
    "AdminFeatureRequests": AdminFeatureRequests,
    "AdminThreats": AdminThreats,
    "Assessment": Assessment,
    "BIA": BIA,
    "CompanyManagement": CompanyManagement,
    "CompanyOnboarding": CompanyOnboarding,
    "Dashboard": Dashboard,
    "EarlyCareer": EarlyCareer,
    "EducationalResources": EducationalResources,
    "EtsiAssessment": EtsiAssessment,
    "EtsiAssessmentsList": EtsiAssessmentsList,
    "EtsiReport": EtsiReport,
    "HTMLReport": HTMLReport,
    "IOCAnalyzer": IOCAnalyzer,
    "IncidentDetail": IncidentDetail,
    "LandingPage": LandingPage,
    "Login": Login,
    "PCIScopingGuide": PCIScopingGuide,
    "PendingApproval": PendingApproval,
    "PolicyCenter": PolicyCenter,
    "PolicyEditor": PolicyEditor,
    "PolicyGenerator": PolicyGenerator,
    "PolicyLibrary": PolicyLibrary,
    "Pricing": Pricing,
    "PricingAndFeatures": PricingAndFeatures,
    "PrivacyPolicy": PrivacyPolicy,
    "ProfessionalReportView": ProfessionalReportView,
    "Questionnaire": Questionnaire,
    "Reports": Reports,
    "RequestFeature": RequestFeature,
    "ResponseReadiness": ResponseReadiness,
    "SampleAssessmentReportView": SampleAssessmentReportView,
    "SampleIncidentReport": SampleIncidentReport,
    "SampleTabletopReport": SampleTabletopReport,
    "SecurityQuestions": SecurityQuestions,
    "SecurityTraining": SecurityTraining,
    "SmartAnalysisSettings": SmartAnalysisSettings,
    "SystemHealth": SystemHealth,
    "TabletopExerciseDetail": TabletopExerciseDetail,
    "TabletopExerciseDraft": TabletopExerciseDraft,
    "TeamManagement": TeamManagement,
    "TermsOfService": TermsOfService,
    "TrainingVideoManager": TrainingVideoManager,
    "TrialExpired": TrialExpired,
    "UserManagement": UserManagement,
}

export const pagesConfig = {
    mainPage: "LandingPage",
    Pages: PAGES,
    Layout: __Layout,
};