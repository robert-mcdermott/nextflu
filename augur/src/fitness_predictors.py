import dendropy, time
import numpy as np
from seq_util import epitope_mask

def calc_epitope_distance(tree, attr='ep', ref = None):
	'''
	calculates the distance at epitope sites of any tree node labeled current to ref
	tree   --   dendropy tree
	attr   --   the attribute name used to save the result
	'''
	epi_mask = np.fromstring(epitope_mask, 'S1')=='1'
	def epitope_distance(seq, ref):
		return np.sum(seq[epi_mask]!=ref[epi_mask])

	for node in tree.postorder_node_iter():
		node.__setattr__(attr, epitope_distance(node.seq, ref))

def calc_epitope_distance(tree, attr='ne', ref = None):
	'''
	calculates the distance at epitope sites of any tree node labeled current to ref
	tree   --   dendropy tree
	attr   --   the attribute name used to save the result
	'''
	epi_mask = np.fromstring(epitope_mask, 'S1')=='1'
	def epitope_distance(seq, ref):
		return np.sum(seq[~epi_mask]!=ref[~epi_mask])

	for node in tree.postorder_node_iter():
		node.__setattr__(attr, epitope_distance(node.seq, ref))


def calc_LBI(tree, attr = 'lbi', tau=0.0007):
	'''
	traverses the tree in postorder and preorder to calculate the
	up and downstream tree length exponentially weighted by distance.
	then adds them as LBI
	tree -- dendropy tree for whose node the LBI is being computed
	attr	 -- the attribute name used to store the result
	'''
	# traverse the tree in postorder (children first) to calculate msg to parents
	for node in tree.postorder_node_iter():
		node.down_polarizer = 0
		node.up_polarizer = 0
		for child in node.child_nodes():
			node.up_polarizer += child.up_polarizer
		bl =  node.edge_length/tau
		node.up_polarizer *= np.exp(-bl)
		if node.current: node.up_polarizer += tau*(1-np.exp(-bl))

	# traverse the tree in preorder (parents first) to calculate msg to children
	for node in tree.preorder_internal_node_iter():
		for child1 in node.child_nodes():
			child1.down_polarizer = node.down_polarizer
			for child2 in node.child_nodes():
				if child1!=child2:
					child1.down_polarizer += child2.up_polarizer

			bl =  child1.edge_length/tau
			child1.down_polarizer *= np.exp(-bl)
			if child1.current: child1.down_polarizer += tau*(1-np.exp(-bl))

	# go over all nodes and calculate the LBI (can be done in any order)
	for node in tree.postorder_node_iter():
		tmp_LBI = node.down_polarizer
		for child in node.child_nodes():
			tmp_LBI += child.up_polarizer
		node.__setattr__(attr, tmp_LBI)



if __name__=='__main__':
	print "--- Testing predictor evaluations ---"
