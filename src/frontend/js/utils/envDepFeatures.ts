import { appData } from '../appData';

/**
 * Indicates if statistics feature has to be shown for the user
 */
export const hasStatisticsFeature = () => appData.env_version === 'MTES';
