import AccessDenied from './pages/AccessDenied';
import ActionItems from './pages/ActionItems';
import AdminFeatureRequests from './pages/AdminFeatureRequests';
import AdminThreats from './pages/AdminThreats';
import Assessment from './pages/Assessment';
import BIA from './pages/BIA';
import BoardRiskDashboard from './pages/BoardRiskDashboard';
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
    "BoardRiskDashboard": BoardRiskDashboard,
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