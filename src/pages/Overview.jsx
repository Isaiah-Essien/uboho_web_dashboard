import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import '../Overview.css';
import StatCard from '../components/StatCard';
import HeaderActions from '../components/HeaderActions';
import OverviewMap from '../components/map/OverviewMap';
import { useHospital } from '../contexts/HospitalContext';
import { useNotifications } from '../contexts/NotificationContext';

const Overview = () => {
	const { getPatients, getAllPatientsSeizureEvents } = useHospital();
	const { unreadCount } = useNotifications();
	const [activePatients, setActivePatients] = useState(0);
	const [activeAlerts, setActiveAlerts] = useState(0);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchStats = async () => {
			setLoading(true);
			try {
				const patients = await getPatients();
				setActivePatients(patients.length);
				const seizurePatients = await getAllPatientsSeizureEvents();
				// Match the map: only count patients whose lastSeizureEvent exists, has a location, and status === 'seizure'
				setActiveAlerts(
					seizurePatients.filter(
						p => p.lastSeizureEvent && p.lastSeizureEvent.location && p.lastSeizureEvent.status === 'seizure'
					).length
				);
			} catch (e) {
				setActivePatients(0);
				setActiveAlerts(0);
			} finally {
				setLoading(false);
			}
		};
		fetchStats();
	}, [getPatients, getAllPatientsSeizureEvents]);

	const cards = [
		{
			title: 'Active Patients',
			percentage: '',
			icon: '/card1-img.svg',
			value: loading ? '...' : activePatients,
		},
		{
			title: 'Active Alerts',
			percentage: '',
			icon: '/card2-img.svg',
			value: loading ? '...' : activeAlerts,
		},
		{
			title: 'Unread Messages',
			percentage: '',
			icon: '/card3-img.svg',
			value: unreadCount,
		},
	];

	return (
		<div className="overview-container">
			<Sidebar />
			<div className="overview-content">
				<div className="overview-header">
					<h2 className="overview-title">
						Overview
					</h2>

					{/* Use the HeaderActions component instead of duplicated search and notification */}
					<HeaderActions />
				</div>

				<div className="card-grid">
					{cards.map((card, index) => (
						<StatCard
							key={index}
							title={card.title}
							percentage={card.percentage}
							icon={card.icon}
							value={card.value}
						/>
					))}
				</div>
				
				{/* Map Legend - Updated to show only seizure patients */}
				<div className="map-legend-section">
					<div className="map-label-row">
						<span className="map-title">Uboho Locator</span>
						<span className="map-dash seizure-dash">–</span>
						<span className="map-seizure">Active Seizure Alerts</span>
					</div>
				</div>
				
				{/* Map Container - Separate from legend */}
				<div className="map-container-section">
					<OverviewMap />
				</div>
			</div>
		</div>
	);
};

export default Overview;
