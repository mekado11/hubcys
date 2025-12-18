import Dashboard from './pages/Dashboard';
import Assessment from './pages/Assessment';
import Reports from './pages/Reports';
import ProfessionalReportView from './pages/ProfessionalReportView';
import EducationalResources from './pages/EducationalResources';
import HTMLReport from './pages/HTMLReport';
import SecurityQuestions from './pages/SecurityQuestions';
import ActionItems from './pages/ActionItems';
import TeamManagement from './pages/TeamManagement';
import LandingPage from './pages/LandingPage';
import Pricing from './pages/Pricing';
import IncidentDetail from './pages/IncidentDetail';
import TabletopExerciseDetail from './pages/TabletopExerciseDetail';
import TabletopExerciseDraft from './pages/TabletopExerciseDraft';
import SampleIncidentReport from './pages/SampleIncidentReport';
import SampleTabletopReport from './pages/SampleTabletopReport';
import CompanyOnboarding from './pages/CompanyOnboarding';
import CompanyManagement from './pages/CompanyManagement';
import SampleAssessmentReportView from './pages/SampleAssessmentReportView';
import PolicyLibrary from './pages/PolicyLibrary';
import PolicyEditor from './pages/PolicyEditor';
import PolicyGenerator from './pages/PolicyGenerator';
import PolicyCenter from './pages/PolicyCenter';
import SecurityTraining from './pages/SecurityTraining';
import ResponseReadiness from './pages/ResponseReadiness';
import TrialExpired from './pages/TrialExpired';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import TrainingVideoManager from './pages/TrainingVideoManager';
import PendingApproval from './pages/PendingApproval';
import AccessDenied from './pages/AccessDenied';
import UserManagement from './pages/UserManagement';
import BIA from './pages/BIA';
import SmartAnalysisSettings from './pages/SmartAnalysisSettings';
import SystemHealth from './pages/SystemHealth';
import PricingAndFeatures from './pages/PricingAndFeatures';
import PCIScopingGuide from './pages/PCIScopingGuide';
import EarlyCareer from './pages/EarlyCareer';
import Questionnaire from './pages/Questionnaire';
import RequestFeature from './pages/RequestFeature';
import AdminFeatureRequests from './pages/AdminFeatureRequests';
import BoardRiskDashboard from './pages/BoardRiskDashboard';
import AdminThreats from './pages/AdminThreats';
import IOCAnalyzer from './pages/IOCAnalyzer';
import EtsiAssessment from './pages/EtsiAssessment';
import EtsiReport from './pages/EtsiReport';
import EtsiAssessmentsList from './pages/EtsiAssessmentsList';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Assessment": Assessment,
    "Reports": Reports,
    "ProfessionalReportView": ProfessionalReportView,
    "EducationalResources": EducationalResources,
    "HTMLReport": HTMLReport,
    "SecurityQuestions": SecurityQuestions,
    "ActionItems": ActionItems,
    "TeamManagement": TeamManagement,
    "LandingPage": LandingPage,
    "Pricing": Pricing,
    "IncidentDetail": IncidentDetail,
    "TabletopExerciseDetail": TabletopExerciseDetail,
    "TabletopExerciseDraft": TabletopExerciseDraft,
    "SampleIncidentReport": SampleIncidentReport,
    "SampleTabletopReport": SampleTabletopReport,
    "CompanyOnboarding": CompanyOnboarding,
    "CompanyManagement": CompanyManagement,
    "SampleAssessmentReportView": SampleAssessmentReportView,
    "PolicyLibrary": PolicyLibrary,
    "PolicyEditor": PolicyEditor,
    "PolicyGenerator": PolicyGenerator,
    "PolicyCenter": PolicyCenter,
    "SecurityTraining": SecurityTraining,
    "ResponseReadiness": ResponseReadiness,
    "TrialExpired": TrialExpired,
    "PrivacyPolicy": PrivacyPolicy,
    "TermsOfService": TermsOfService,
    "TrainingVideoManager": TrainingVideoManager,
    "PendingApproval": PendingApproval,
    "AccessDenied": AccessDenied,
    "UserManagement": UserManagement,
    "BIA": BIA,
    "SmartAnalysisSettings": SmartAnalysisSettings,
    "SystemHealth": SystemHealth,
    "PricingAndFeatures": PricingAndFeatures,
    "PCIScopingGuide": PCIScopingGuide,
    "EarlyCareer": EarlyCareer,
    "Questionnaire": Questionnaire,
    "RequestFeature": RequestFeature,
    "AdminFeatureRequests": AdminFeatureRequests,
    "BoardRiskDashboard": BoardRiskDashboard,
    "AdminThreats": AdminThreats,
    "IOCAnalyzer": IOCAnalyzer,
    "EtsiAssessment": EtsiAssessment,
    "EtsiReport": EtsiReport,
    "EtsiAssessmentsList": EtsiAssessmentsList,
}

export const pagesConfig = {
    mainPage: "LandingPage",
    Pages: PAGES,
    Layout: __Layout,
};